import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_ENGINE_URL = "https://casablanca-audio-engine-production.up.railway.app/analyze";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function getAIFallbackScores(fileName: string, apiKey: string): Promise<Record<string, any>> {
  console.log("Railway engine failed, falling back to AI estimation for:", fileName);

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are a music analysis engine. Given an audio file name, generate realistic estimated audio analysis scores. Use the tool provided to return structured data. Base your estimates on the file name, genre hints, and typical ranges for each metric. Be realistic — not everything should be high.`,
        },
        {
          role: "user",
          content: `Analyze this audio file and provide estimated scores: "${fileName}". Generate realistic values as if this were a real vocal/music performance analysis.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "audio_analysis_result",
            description: "Return structured audio analysis scores",
            parameters: {
              type: "object",
              properties: {
                pitch_accuracy: { type: "number", description: "0-100 score for pitch accuracy" },
                timing_accuracy: { type: "number", description: "0-100 score for timing/rhythm accuracy" },
                tempo_bpm: { type: "number", description: "Estimated tempo in BPM (60-200)" },
                energy_score: { type: "number", description: "0-10 energy/performance score" },
                spectral_brightness: { type: "number", description: "0-100 spectral brightness" },
                dynamic_range: { type: "number", description: "0-100 dynamic range" },
                onset_strength: { type: "number", description: "0-100 onset strength" },
                vocal_confidence: { type: "number", description: "0-100 vocal detection confidence" },
                overall_score: { type: "number", description: "0-100 overall quality score" },
                vocal_range_low: { type: "string", description: "Low vocal range note e.g. C3" },
                vocal_range_high: { type: "string", description: "High vocal range note e.g. C5" },
                vocal_classification: { type: "string", description: "e.g. Tenor, Alto, Soprano, Baritone" },
                tone_profiles: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-4 tone descriptors e.g. warm, bright, raspy",
                },
                genre_probabilities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      genre: { type: "string" },
                      probability: { type: "number" },
                    },
                    required: ["genre", "probability"],
                  },
                  description: "3-5 genres with probability percentages",
                },
              },
              required: [
                "pitch_accuracy", "timing_accuracy", "tempo_bpm", "energy_score",
                "spectral_brightness", "dynamic_range", "onset_strength", "vocal_confidence",
                "overall_score", "vocal_range_low", "vocal_range_high", "vocal_classification",
                "tone_profiles", "genre_probabilities",
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "audio_analysis_result" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("AI did not return structured tool call");
  }

  return JSON.parse(toolCall.function.arguments);
}

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
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio file: ${audioResponse.status}`);
      }
      audioBlob = await audioResponse.blob();
      const urlParts = audioUrl.split("/");
      fileName = urlParts[urlParts.length - 1] || "audio.mp3";
    }

    let r: Record<string, any>;
    let analysisEngine = "Essentia";
    let isPlaceholder = false;

    // Try Railway Essentia engine first
    try {
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

      r = await analysisResponse.json();
    } catch (engineErr) {
      console.warn("Essentia engine failed, using AI fallback:", engineErr);

      // Fallback to Lovable AI
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) {
        throw new Error("Both Essentia engine and AI fallback unavailable (no LOVABLE_API_KEY)");
      }

      r = await getAIFallbackScores(fileName, apiKey);
      analysisEngine = "AI Estimated (Gemini)";
      isPlaceholder = true;
    }

    // Map response fields to vocal_dna columns
    const pitchAccuracy = r.pitch_accuracy ?? 0;
    const timingAccuracy = r.timing_accuracy ?? r.rhythm_stability ?? 0;
    const tempoBpm = r.tempo_bpm ?? 0;
    const energyScore = r.energy_score ?? r.tone_quality ?? 0;
    const spectralBrightness = r.spectral_brightness ?? 0;
    const dynamicRange = r.dynamic_range ?? 0;
    const onsetStrength = r.onset_strength ?? 0;
    const vocalConfidence = r.vocal_confidence ?? 0;
    const overallScore = r.overall_score ?? 0;

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
          analysis_engine: analysisEngine,
          is_placeholder: isPlaceholder,
          analysis_raw_json: r,
        },
        { onConflict: "submission_id" }
      );

    if (upsertErr) {
      console.error("Failed to upsert vocal_dna:", upsertErr);
      throw new Error("Database update failed");
    }

    await supabaseAdmin
      .from("submissions")
      .update({ audio_analysis_status: "complete" })
      .eq("id", submissionId);

    return new Response(
      JSON.stringify({
        success: true,
        engine: analysisEngine,
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
