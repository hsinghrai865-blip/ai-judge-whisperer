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

    // Download the audio file from storage
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio file: ${audioResponse.status}`);
    }
    const audioBlob = await audioResponse.blob();

    // Determine filename from URL
    const urlParts = audioUrl.split("/");
    const fileName = urlParts[urlParts.length - 1] || "audio.mp3";

    // Send to external analysis engine as multipart form-data
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

    const analysisResult = await analysisResponse.json();

    // Store the analysis scores in the database
    // Update vocal_dna with real analysis data
    const { error: upsertErr } = await supabaseAdmin
      .from("vocal_dna")
      .upsert(
        {
          submission_id: submissionId,
          pitch_accuracy: analysisResult.pitch_accuracy ?? 0,
          rhythm_timing: analysisResult.rhythm_stability ?? 0,
          performance_energy: analysisResult.tone_quality ?? 0,
          vocal_range_low: "N/A",
          vocal_range_high: "N/A",
          vocal_classification: "Analyzed",
          tone_profiles: [],
          genre_probabilities: [],
          analysis_status: "signal_analyzed",
          analysis_engine: "casablanca-audio-engine",
          is_placeholder: false,
          analysis_raw_json: analysisResult,
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
          pitch_accuracy: analysisResult.pitch_accuracy,
          rhythm_stability: analysisResult.rhythm_stability,
          tone_quality: analysisResult.tone_quality,
          overall_score: analysisResult.overall_score,
        },
        raw: analysisResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-audio error:", e);

    // Try to update status to failed if we have a submissionId
    try {
      const body = await new Response(e instanceof Error ? "" : "").text();
    } catch {}

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
