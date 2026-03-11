import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * audio-analysis-webhook
 * 
 * This edge function receives vocal analysis results from an external 
 * audio processing engine (e.g., Essentia, Praat) and updates the 
 * vocal_dna record for the given submission.
 * 
 * Expected POST body:
 * {
 *   submissionId: string,
 *   vocalRangeLow: string,        // e.g. "A2"
 *   vocalRangeHigh: string,       // e.g. "F4"
 *   vocalClassification: string,  // e.g. "Baritone"
 *   pitchAccuracy: number,        // 0-100
 *   rhythmTiming: number,         // 0-100
 *   toneProfiles: string[],       // e.g. ["Warm", "Smooth"]
 *   genreProbabilities: { genre: string, probability: number }[],
 *   performanceEnergy: number,    // 0-10
 *   analysisEngine: string,       // e.g. "essentia-v2.1"
 *   rawJson?: object              // full raw analysis output
 * }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return new Response(JSON.stringify({ error: "Missing submissionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert vocal_dna with real analysis data
    const { error: upsertErr } = await supabaseAdmin
      .from("vocal_dna")
      .upsert(
        {
          submission_id: submissionId,
          vocal_range_low: body.vocalRangeLow,
          vocal_range_high: body.vocalRangeHigh,
          vocal_classification: body.vocalClassification,
          pitch_accuracy: body.pitchAccuracy,
          rhythm_timing: body.rhythmTiming,
          tone_profiles: body.toneProfiles || [],
          genre_probabilities: body.genreProbabilities || [],
          performance_energy: body.performanceEnergy,
          analysis_status: "signal_analyzed",
          analysis_engine: body.analysisEngine || "unknown",
          is_placeholder: false,
          analysis_raw_json: body.rawJson || null,
        },
        { onConflict: "submission_id" }
      );

    if (upsertErr) {
      console.error("Failed to upsert vocal_dna:", upsertErr);
      throw new Error("Database update failed");
    }

    // Update submission analysis status
    await supabaseAdmin
      .from("submissions")
      .update({ audio_analysis_status: "complete" })
      .eq("id", submissionId);

    return new Response(
      JSON.stringify({ success: true, message: "Vocal DNA updated with real analysis data" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("audio-analysis-webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
