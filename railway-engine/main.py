from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import tempfile
import subprocess
import os
import traceback

app = FastAPI(title="Casablanca Audio Engine", version="1.1.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_log():
    print(
        f"[boot] python={os.sys.version.split()[0]} port={os.getenv('PORT', '<unset>')} pid={os.getpid()}",
        flush=True,
    )


@app.get("/")
def health():
    return {"status": "ok", "engine": "essentia", "version": "1.1.1"}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


def convert_to_wav(input_path: str) -> str:
    """Convert any audio format to WAV using ffmpeg for reliable Essentia loading."""
    wav_path = input_path + ".wav"
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", input_path, "-ac", "1", "-ar", "44100", "-f", "wav", wav_path],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {result.stderr[:500]}")
    return wav_path


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or ".mp3")[1]
    tmp_path = None
    wav_path = None

    try:
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Convert to WAV first for reliable codec support (handles .m4a, .ogg, .flac, etc.)
        wav_path = convert_to_wav(tmp_path)

        # Lazy-load Essentia so startup stays healthy even if Essentia fails
        try:
            import essentia.standard as es
        except Exception as import_error:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Essentia import failed: {import_error}"},
            )

        # Load audio with Essentia
        audio = es.MonoLoader(filename=wav_path, sampleRate=44100)()

        if len(audio) == 0:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Audio file is empty or unreadable"},
            )

        # --- Pitch Analysis ---
        pitch_extractor = es.PredominantPitchMelodia()
        pitch_values, pitch_confidence = pitch_extractor(audio)
        valid_pitches = pitch_values[pitch_values > 0]
        vocal_confidence = (
            float(np.mean(pitch_confidence[pitch_values > 0]) * 100) if len(valid_pitches) > 0 else 0
        )

        if len(valid_pitches) > 1:
            pitch_std = float(np.std(valid_pitches))
            pitch_accuracy = max(0, min(100, 100 - (pitch_std / 5)))
        else:
            pitch_accuracy = 0

        # --- Rhythm / Tempo ---
        rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
        bpm, beats, beats_confidence, _, _ = rhythm_extractor(audio)
        tempo_bpm = float(bpm)

        if len(beats) > 2:
            intervals = np.diff(beats)
            timing_std = float(np.std(intervals))
            median_interval = float(np.median(intervals))
            timing_accuracy = (
                max(0, min(100, 100 - (timing_std / median_interval * 100))) if median_interval > 0 else 0
            )
        else:
            timing_accuracy = 50

        # --- Energy ---
        rms = es.RMS()(audio)
        energy_score = float(min(10, rms * 100))

        # --- Spectral Brightness ---
        spectrum = es.Spectrum()(audio)
        centroid = es.Centroid(range=22050)(spectrum)
        spectral_brightness = float(min(100, centroid * 100 / 5000))

        # --- Dynamic Range ---
        envelope = es.Envelope()(audio)
        dynamic_range = float(min(100, (np.max(envelope) - np.min(envelope)) * 100))

        # --- Onset Strength ---
        onsets = es.OnsetRate()(audio)
        onset_rate = float(onsets[1]) if len(onsets) > 1 else 0
        onset_strength = float(min(100, onset_rate * 10))

        # --- Overall Score ---
        overall_score = round(
            (
                pitch_accuracy * 0.25
                + timing_accuracy * 0.2
                + vocal_confidence * 0.2
                + spectral_brightness * 0.1
                + energy_score * 10 * 0.1
                + dynamic_range * 0.1
                + onset_strength * 0.05
            ),
            1,
        )

        return {
            "pitch_accuracy": round(pitch_accuracy, 1),
            "timing_accuracy": round(timing_accuracy, 1),
            "tempo_bpm": round(tempo_bpm, 1),
            "energy_score": round(energy_score, 1),
            "spectral_brightness": round(spectral_brightness, 1),
            "dynamic_range": round(dynamic_range, 1),
            "onset_strength": round(onset_strength, 1),
            "vocal_confidence": round(vocal_confidence, 1),
            "overall_score": round(overall_score, 1),
            # Legacy fields
            "rhythm_stability": round(timing_accuracy, 1),
            "tone_quality": round(energy_score * 10, 1),
        }

    except Exception as e:
        print(f"Analysis error: {e}", flush=True)
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
