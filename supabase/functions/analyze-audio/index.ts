import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_ENGINE_URL = "https://casablanca-audio-engine-production.up.railway.app/analyze";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, audioUrl } = await req.json();

    if (!submissionId || !audioUrl) {
      return new Response(
        JSON.stringify({ error: "Missing submissionId or audioUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update status to analyzing
    await supabaseAdmin
      .from("submissions")
      .update({ audio_analysis_status: "analyzing" })
      .eq("id", submissionId);

    // Extract storage path from the public URL
    const storagePathMatch = audioUrl.match(/audio-submissions\/(.+)$/);
    let audioBlob: Blob;
    let fileName: string;

    if (storagePathMatch) {
      // Download from private bucket using service role
      const storagePath = decodeURIComponent(storagePathMatch[1]);
      const { data: fileData, error: dlError } = await supabaseAdmin.storage
        .from("audio-submissions")
        .download(storagePath);

      if (dlError || !fileData) {
        throw new Error(`Failed to download audio from storage: ${dlError?.message || "No data"}`);
      }
      audioBlob = fileData;
      fileName = storagePath.split("/").pop() || "audio.mp3";
    } else {
      // Fallback: direct fetch for external URLs
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio file: ${audioResponse.status}`);
      }
      audioBlob = await audioResponse.blob();
      const urlParts = audioUrl.split("/");
      fileName = urlParts[urlParts.length - 1] || "audio.mp3";
    }

    // Send to Essentia-powered Railway analysis engine
    const formData = new FormData();
    formData.append("file", audioBlob, fileName);

    const analysisResponse = await fetch(ANALYSIS_ENGINE_URL, {
      method: "POST",
      body: formData,
    });

    if (!analysisResponse.ok) {
      const errText = await analysisResponse.text();
      throw new Error(`Analysis engine returned ${analysisResponse.status}: ${errText}`);
    }

    const r = await analysisResponse.json();

    // Map Essentia response fields to vocal_dna columns
    const pitchAccuracy = r.pitch_accuracy ?? 0;
    const timingAccuracy = r.timing_accuracy ?? r.rhythm_stability ?? 0;
    const tempoBpm = r.tempo_bpm ?? 0;
    const energyScore = r.energy_score ?? r.tone_quality ?? 0;
    const spectralBrightness = r.spectral_brightness ?? 0;
    const dynamicRange = r.dynamic_range ?? 0;
    const onsetStrength = r.onset_strength ?? 0;
    const vocalConfidence = r.vocal_confidence ?? 0;
    const overallScore = r.overall_score ?? 0;

    // Store Essentia signal-processed results in vocal_dna
    const { error: upsertErr } = await supabaseAdmin
      .from("vocal_dna")
      .upsert(
        {
          submission_id: submissionId,
          pitch_accuracy: pitchAccuracy,
          rhythm_timing: timingAccuracy,
          timing_accuracy: timingAccuracy,
          performance_energy: energyScore,
          energy_score: energyScore,
          tempo_bpm: tempoBpm,
          spectral_brightness: spectralBrightness,
          dynamic_range: dynamicRange,
          onset_strength: onsetStrength,
          vocal_confidence: vocalConfidence,
          vocal_range_low: r.vocal_range_low ?? "N/A",
          vocal_range_high: r.vocal_range_high ?? "N/A",
          vocal_classification: r.vocal_classification ?? "Analyzed",
          tone_profiles: r.tone_profiles ?? [],
          genre_probabilities: r.genre_probabilities ?? [],
          analysis_status: "complete",
          analysis_engine: "Essentia",
          is_placeholder: false,
          analysis_raw_json: r,
        },
        { onConflict: "submission_id" }
      );

    if (upsertErr) {
      console.error("Failed to upsert vocal_dna:", upsertErr);
      throw new Error("Database update failed");
    }

    // Update submission status to complete
    await supabaseAdmin
      .from("submissions")
      .update({ audio_analysis_status: "complete" })
      .eq("id", submissionId);

    return new Response(
      JSON.stringify({
        success: true,
        scores: {
          pitch_accuracy: pitchAccuracy,
          timing_accuracy: timingAccuracy,
          tempo_bpm: tempoBpm,
          energy_score: energyScore,
          spectral_brightness: spectralBrightness,
          dynamic_range: dynamicRange,
          onset_strength: onsetStrength,
          vocal_confidence: vocalConfidence,
          overall_score: overallScore,
        },
        raw: r,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-audio error:", e);

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
