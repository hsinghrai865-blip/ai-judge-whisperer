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
    const { artistName, email, genre, gender, age, country, languages, phone, socialHandle, yearsExperience, audioUrl, fileName } = await req.json();

    if (!artistName || !email || !genre || !audioUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create submission record
    const { data: submission, error: insertErr } = await supabaseAdmin
      .from("submissions")
      .insert({
        title: `Demo - ${artistName}`,
        artist_name: artistName,
        category: genre.toLowerCase(),
        platform: "casablanca",
        content_type: "audio",
        audio_url: audioUrl,
        audio_analysis_status: "uploaded",
        submitter_email: email,
        origin: "public-demo",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    const submissionId = submission.id;

    // 2. Send thank-you email (non-blocking)
    sendThankYouEmail(supabaseAdmin, email, artistName).catch((e) =>
      console.error("Thank-you email failed:", e)
    );

    // 3. Trigger audio analysis
    try {
      // Download audio
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) throw new Error(`Failed to download audio: ${audioResponse.status}`);
      const audioBlob = await audioResponse.blob();

      const formData = new FormData();
      formData.append("file", audioBlob, fileName || "demo.mp3");

      // Update status
      await supabaseAdmin
        .from("submissions")
        .update({ audio_analysis_status: "analyzing" })
        .eq("id", submissionId);

      const analysisResponse = await fetch(ANALYSIS_ENGINE_URL, {
        method: "POST",
        body: formData,
      });

      if (!analysisResponse.ok) {
        const errText = await analysisResponse.text();
        throw new Error(`Analysis engine returned ${analysisResponse.status}: ${errText}`);
      }

      const analysisResult = await analysisResponse.json();

      // Store in vocal_dna
      await supabaseAdmin.from("vocal_dna").upsert(
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

      // Update submission status
      await supabaseAdmin
        .from("submissions")
        .update({ audio_analysis_status: "complete", status: "scored" })
        .eq("id", submissionId);

      // 4. Now run AI Judge for full evaluation
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
      }

      // 5. Send feedback email with results
      sendFeedbackEmail(supabaseAdmin, email, artistName, analysisResult, aiResults).catch((e) =>
        console.error("Feedback email failed:", e)
      );

      return new Response(
        JSON.stringify({ success: true, submissionId, scores: analysisResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (analysisErr: any) {
      console.error("Analysis error:", analysisErr);
      await supabaseAdmin
        .from("submissions")
        .update({ audio_analysis_status: "failed" })
        .eq("id", submissionId);

      // Still return success for the submission itself
      return new Response(
        JSON.stringify({ success: true, submissionId, analysisError: analysisErr.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e: any) {
    console.error("submit-demo error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendThankYouEmail(supabase: any, email: string, artistName: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("LOVABLE_API_KEY not set, skipping thank-you email");
    return;
  }

  const projectId = Deno.env.get("SUPABASE_URL")?.match(/https:\/\/([^.]+)/)?.[1];

  const response = await fetch(
    `https://api.lovable.dev/api/v1/projects/${projectId}/emails/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        purpose: "transactional",
        to: email,
        subject: "Thank You for Your Demo Submission – Casablanca Vision",
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">Casablanca Vision</h1>
              <div style="width: 60px; height: 3px; background: linear-gradient(135deg, #c9a227, #e6c558); margin: 12px auto;"></div>
            </div>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${artistName},</p>
            <p style="font-size: 15px; color: #555; line-height: 1.7;">
              Thank you for submitting your demo to <strong>Casablanca Vision</strong>. We're excited to hear your sound!
            </p>
            <p style="font-size: 15px; color: #555; line-height: 1.7;">
              Your recording is now being assessed by our AI-powered analysis engine. This process evaluates your pitch accuracy, rhythm stability, tone quality, and overall performance.
            </p>
            <div style="background: #f8f6f0; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #c9a227;">
              <p style="font-size: 14px; color: #555; margin: 0;"><strong>What happens next?</strong></p>
              <p style="font-size: 14px; color: #666; margin: 8px 0 0 0;">
                You'll receive a follow-up email with your detailed AI feedback results once the analysis is complete.
              </p>
            </div>
            <p style="font-size: 14px; color: #888; margin-top: 30px;">Best regards,<br/><strong>The Casablanca Vision Team</strong></p>
          </div>
        `,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Email send failed:", errText);
  }
}

async function sendFeedbackEmail(
  supabase: any,
  email: string,
  artistName: string,
  audioScores: any,
  aiResults: any
) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("LOVABLE_API_KEY not set, skipping feedback email");
    return;
  }

  const projectId = Deno.env.get("SUPABASE_URL")?.match(/https:\/\/([^.]+)/)?.[1];

  const pitchScore = audioScores?.pitch_accuracy?.toFixed(1) ?? "N/A";
  const rhythmScore = audioScores?.rhythm_stability?.toFixed(1) ?? "N/A";
  const toneScore = audioScores?.tone_quality?.toFixed(1) ?? "N/A";
  const overallScore = audioScores?.overall_score?.toFixed(1) ?? "N/A";

  const aiFeedback = aiResults?.feedback || "";
  const aiOverall = aiResults?.overall?.toFixed(1) || "";

  const response = await fetch(
    `https://api.lovable.dev/api/v1/projects/${projectId}/emails/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        purpose: "transactional",
        to: email,
        subject: "Your Demo Results Are Ready – Casablanca Vision",
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">Casablanca Vision</h1>
              <div style="width: 60px; height: 3px; background: linear-gradient(135deg, #c9a227, #e6c558); margin: 12px auto;"></div>
            </div>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${artistName},</p>
            <p style="font-size: 15px; color: #555; line-height: 1.7;">
              Great news! Your demo analysis is complete. Here are your results:
            </p>

            <div style="background: #f8f6f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="font-size: 16px; color: #1a1a2e; margin: 0 0 16px 0;">🎵 Audio Analysis Scores</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #555; font-size: 14px;">Pitch Accuracy</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #c9a227; font-size: 16px;">${pitchScore}</td></tr>
                <tr><td style="padding: 8px 0; color: #555; font-size: 14px;">Rhythm Stability</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #c9a227; font-size: 16px;">${rhythmScore}</td></tr>
                <tr><td style="padding: 8px 0; color: #555; font-size: 14px;">Tone Quality</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #c9a227; font-size: 16px;">${toneScore}</td></tr>
                <tr style="border-top: 2px solid #e0dcd0;"><td style="padding: 12px 0; color: #1a1a2e; font-size: 15px; font-weight: bold;">Overall Score</td><td style="padding: 12px 0; text-align: right; font-weight: bold; color: #c9a227; font-size: 20px;">${overallScore}</td></tr>
              </table>
            </div>

            ${aiOverall ? `
            <div style="background: #f0f4f8; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="font-size: 16px; color: #1a1a2e; margin: 0 0 12px 0;">✨ AI Creative Evaluation: ${aiOverall}/10</h3>
              <p style="font-size: 14px; color: #555; line-height: 1.7; margin: 0;">${aiFeedback}</p>
            </div>
            ` : ""}

            <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="font-size: 15px; color: #e6c558; font-weight: bold; margin: 0 0 8px 0;">What's Next?</p>
              <p style="font-size: 14px; color: #cccccc; line-height: 1.7; margin: 0;">
                A member of our team will contact you shortly with the decision to onboard. Stay tuned!
              </p>
            </div>

            <p style="font-size: 14px; color: #888; margin-top: 30px;">Best regards,<br/><strong>The Casablanca Vision Team</strong></p>
          </div>
        `,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Feedback email send failed:", errText);
  }
}
