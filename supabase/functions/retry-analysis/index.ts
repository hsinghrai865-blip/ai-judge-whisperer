import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_ENGINE_URL = "https://casablanca-audio-engine-production.up.railway.app/analyze";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { submissionId } = await req.json();
    if (!submissionId) {
      return new Response(JSON.stringify({ error: "submissionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the existing submission
    const { data: submission, error: fetchErr } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (fetchErr || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!submission.audio_url) {
      return new Response(JSON.stringify({ error: "No audio URL on this submission" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Retrying analysis for submission ${submissionId}: ${submission.artist_name}`);

    // Reset status
    await supabaseAdmin
      .from("submissions")
      .update({ audio_analysis_status: "analyzing", status: "judging" })
      .eq("id", submissionId);

    // Download audio - handle cross-project URLs
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const isLocalStorage = submission.audio_url.startsWith(supabaseUrl);
    const storagePathMatch = submission.audio_url.match(/audio-submissions\/(.+)$/);
    let audioBlob: Blob;

    if (isLocalStorage && storagePathMatch) {
      const storagePath = decodeURIComponent(storagePathMatch[1]);
      const { data: fileData, error: dlError } = await supabaseAdmin.storage
        .from("audio-submissions")
        .download(storagePath);

      if (dlError || !fileData) {
        throw new Error(`Failed to download from local storage: ${dlError?.message || "No data"}`);
      }
      audioBlob = fileData;
    } else {
      console.log(`Fetching external audio: ${submission.audio_url.substring(0, 80)}...`);
      const audioResponse = await fetch(submission.audio_url);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio (${audioResponse.status})`);
      }
      audioBlob = await audioResponse.blob();
      if (audioBlob.size === 0) {
        throw new Error("Downloaded audio file is empty");
      }
      console.log(`Downloaded: ${audioBlob.size} bytes`);
    }

    // Send to analysis engine
    const formData = new FormData();
    formData.append("file", audioBlob, "retry-audio.mp3");

    const analysisResponse = await fetch(ANALYSIS_ENGINE_URL, {
      method: "POST",
      body: formData,
    });

    if (!analysisResponse.ok) {
      const errText = await analysisResponse.text();
      throw new Error(`Analysis engine returned ${analysisResponse.status}: ${errText}`);
    }

    const r = await analysisResponse.json();

    // Upsert vocal_dna (update existing or insert new)
    await supabaseAdmin.from("vocal_dna").upsert(
      {
        submission_id: submissionId,
        pitch_accuracy: r.pitch_accuracy ?? 0,
        rhythm_timing: r.timing_accuracy ?? r.rhythm_stability ?? 0,
        timing_accuracy: r.timing_accuracy ?? r.rhythm_stability ?? 0,
        performance_energy: r.energy_score ?? r.tone_quality ?? 0,
        energy_score: r.energy_score ?? r.tone_quality ?? 0,
        tempo_bpm: r.tempo_bpm ?? 0,
        spectral_brightness: r.spectral_brightness ?? 0,
        dynamic_range: r.dynamic_range ?? 0,
        onset_strength: r.onset_strength ?? 0,
        vocal_confidence: r.vocal_confidence ?? 0,
        vocal_range_low: r.vocal_range_low ?? "N/A",
        vocal_range_high: r.vocal_range_high ?? "N/A",
        vocal_classification: r.vocal_classification ?? "Analyzed",
        tone_profiles: r.tone_profiles ?? [],
        genre_probabilities: r.genre_probabilities ?? [],
        analysis_status: "signal_analyzed",
        analysis_engine: "Essentia",
        is_placeholder: false,
        analysis_raw_json: r,
      },
      { onConflict: "submission_id" }
    );

    // Update submission
    await supabaseAdmin
      .from("submissions")
      .update({ audio_analysis_status: "complete", status: "scored" })
      .eq("id", submissionId);

    // Trigger AI Judge
    const aiJudgeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-judge`;
    const aiJudgeResponse = await fetch(aiJudgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ submissionId }),
    });

    let aiResults = null;
    if (aiJudgeResponse.ok) {
      aiResults = await aiJudgeResponse.json();
    } else {
      console.error("AI Judge failed:", await aiJudgeResponse.text());
    }

    console.log(`Retry complete for ${submissionId}`);

    return new Response(
      JSON.stringify({ success: true, submissionId, scores: r, aiResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("retry-analysis error:", e);

    // Try to mark as failed
    try {
      const { submissionId } = await new Response(req.body).json().catch(() => ({}));
      if (submissionId) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseAdmin
          .from("submissions")
          .update({ audio_analysis_status: "failed", status: "pending" })
          .eq("id", submissionId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: e.message || "Retry failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
