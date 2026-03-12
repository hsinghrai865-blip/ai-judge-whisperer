import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
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

    await supabaseAdmin
      .from("submissions")
      .update({ status: "judging" })
      .eq("id", submissionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert talent judge, vocal analyst, and A&R strategist for music, poetry, performing arts, and creative expression competitions. You evaluate submissions from two platforms:
- Casablanca Vision: A music label focused on discovering artists blending Moroccan/North African sounds with global genres
- Growth Tour: A youth talent platform for music, poetry, sports, creative expression, and aspirations

You MUST produce FOUR evaluation layers:

LAYER 1 - PERFORMANCE SCORES (4 criteria, each 0.0-10.0):
1. Technical Skill - execution quality, technique, proficiency
2. Creativity & Originality - uniqueness, innovation, artistic vision
3. Emotional Impact - storytelling, audience connection, feeling evoked
4. Potential - growth trajectory, market readiness, future promise

LAYER 2 - VOCAL DNA (vocal analysis profile):
- Vocal range (low note and high note, e.g. "A2" and "F4")
- Vocal classification (one of: Bass, Baritone, Tenor, Alto, Mezzo, Soprano)
- Pitch accuracy (0-100 percentage)
- Rhythm timing accuracy (0-100 percentage)
- Tone profiles (2-4 descriptors from: Warm, Bright, Breathy, Raspy, Smooth, Powerful, Silky, Gritty, Rich, Airy, Mid-Forward, Dark, Nasal, Clear)
- Genre fit probabilities (3-5 genres with percentage 0-100)
- Performance energy score (0.0-10.0)

LAYER 3 - ARTIST POTENTIAL INDEX (commercial breakout potential):
- Commercial Appeal (0.0-10.0): suitability for streaming, radio, playlists
- Memorability (0.0-10.0): how distinctive after one listen
- Replay Value (0.0-10.0): likelihood listeners replay
- Brand Identity Potential (0.0-10.0): recognizable style/character potential
- Growth Potential (0.0-10.0): raw upside if developed by a label
- Market Fit (3-5 markets with confidence 0-100)
- AI Summary (2-3 sentences on commercial promise and positioning)

LAYER 4 - SOCIAL BREAKOUT POTENTIAL (viral/short-form platform analysis):
- Hook Strength (0.0-10.0): how strong the vocal melody or phrase hook is for short video clips
- Clipability (0.0-10.0): how easily a 10-20 second section could be extracted for viral clips
- Emotional Reactivity (0.0-10.0): likelihood listeners react emotionally to the voice/sound
- Dance Compatibility (0.0-10.0): whether the rhythm could inspire dance trends or performance clips
- Discovery Potential (0.0-10.0): likelihood the track performs well in algorithm-driven discovery feeds (TikTok, Reels, Shorts)
- AI Summary (2-3 sentences on social/viral potential)

Be fair but discerning. Provide specific, constructive analysis.`;

    const userPrompt = `Evaluate this submission with all four layers (Performance, Vocal DNA, Artist Potential Index, Social Breakout Potential):

Title: ${submission.title}
Artist: ${submission.artist_name}
Category: ${submission.category}
Platform: ${submission.platform === "casablanca" ? "Casablanca Vision" : "Growth Tour"}
Content Type: ${submission.content_type}
${submission.description ? `Description: ${submission.description}` : ""}
${submission.content_text ? `Content:\n${submission.content_text}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_evaluation",
              description: "Submit the complete four-layer evaluation.",
              parameters: {
                type: "object",
                properties: {
                  technicalSkill: { type: "number", description: "Score 0.0-10.0" },
                  creativityOriginality: { type: "number", description: "Score 0.0-10.0" },
                  emotionalImpact: { type: "number", description: "Score 0.0-10.0" },
                  potential: { type: "number", description: "Score 0.0-10.0" },
                  feedback: { type: "string", description: "Detailed constructive feedback (2-4 sentences)" },
                  vocalDNA: {
                    type: "object",
                    properties: {
                      vocalRangeLow: { type: "string" },
                      vocalRangeHigh: { type: "string" },
                      vocalClassification: { type: "string", enum: ["Bass", "Baritone", "Tenor", "Alto", "Mezzo", "Soprano"] },
                      pitchAccuracy: { type: "number" },
                      rhythmTiming: { type: "number" },
                      toneProfiles: { type: "array", items: { type: "string" } },
                      genreProbabilities: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            genre: { type: "string" },
                            probability: { type: "number" },
                          },
                          required: ["genre", "probability"],
                          additionalProperties: false,
                        },
                      },
                      performanceEnergy: { type: "number" },
                    },
                    required: ["vocalRangeLow", "vocalRangeHigh", "vocalClassification", "pitchAccuracy", "rhythmTiming", "toneProfiles", "genreProbabilities", "performanceEnergy"],
                    additionalProperties: false,
                  },
                  artistPotentialIndex: {
                    type: "object",
                    properties: {
                      commercialAppeal: { type: "number", description: "0.0-10.0" },
                      memorability: { type: "number", description: "0.0-10.0" },
                      replayValue: { type: "number", description: "0.0-10.0" },
                      brandIdentityPotential: { type: "number", description: "0.0-10.0" },
                      growthPotential: { type: "number", description: "0.0-10.0" },
                      marketFit: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            market: { type: "string" },
                            confidence: { type: "number" },
                          },
                          required: ["market", "confidence"],
                          additionalProperties: false,
                        },
                      },
                      aiSummary: { type: "string", description: "2-3 sentence commercial analysis" },
                    },
                    required: ["commercialAppeal", "memorability", "replayValue", "brandIdentityPotential", "growthPotential", "marketFit", "aiSummary"],
                    additionalProperties: false,
                  },
                  socialBreakout: {
                    type: "object",
                    properties: {
                      hookStrength: { type: "number", description: "0.0-10.0" },
                      clipability: { type: "number", description: "0.0-10.0" },
                      emotionalReactivity: { type: "number", description: "0.0-10.0" },
                      danceCompatibility: { type: "number", description: "0.0-10.0" },
                      discoveryPotential: { type: "number", description: "0.0-10.0" },
                      aiSummary: { type: "string", description: "2-3 sentence social/viral analysis" },
                    },
                    required: ["hookStrength", "clipability", "emotionalReactivity", "danceCompatibility", "discoveryPotential", "aiSummary"],
                    additionalProperties: false,
                  },
                },
                required: ["technicalSkill", "creativityOriginality", "emotionalImpact", "potential", "feedback", "vocalDNA", "artistPotentialIndex", "socialBreakout"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      }),
    });

    if (!response.ok) {
      await supabaseAdmin.from("submissions").update({ status: "pending" }).eq("id", submissionId);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      await supabaseAdmin.from("submissions").update({ status: "pending" }).eq("id", submissionId);
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);
    const overall = Math.round(
      ((result.technicalSkill + result.creativityOriginality + result.emotionalImpact + result.potential) / 4) * 10
    ) / 10;

    // Save AI scores
    const { error: scoreErr } = await supabaseAdmin.from("ai_scores").upsert({
      submission_id: submissionId,
      technical_skill: result.technicalSkill,
      creativity_originality: result.creativityOriginality,
      emotional_impact: result.emotionalImpact,
      potential: result.potential,
      overall_score: overall,
      feedback: result.feedback,
    }, { onConflict: "submission_id" });

    if (scoreErr) {
      console.error("Failed to save scores:", scoreErr);
      await supabaseAdmin.from("submissions").update({ status: "pending" }).eq("id", submissionId);
      throw new Error("Failed to save scores");
    }

    // Save Vocal DNA — preserve Essentia signal metrics when they already exist
    const vdna = result.vocalDNA;
    let responseVocalDNA: Record<string, any>;

    const { data: existingDna } = await supabaseAdmin
      .from("vocal_dna")
      .select(
        "analysis_status, analysis_engine, is_placeholder, pitch_accuracy, rhythm_timing, timing_accuracy, performance_energy, energy_score, tempo_bpm, spectral_brightness, dynamic_range, onset_strength, vocal_confidence"
      )
      .eq("submission_id", submissionId)
      .single();

    const hasSignalDna = existingDna?.is_placeholder === false;

    if (hasSignalDna) {
      const enrichedEngine = existingDna?.analysis_engine?.includes("+ AI")
        ? existingDna.analysis_engine
        : `${existingDna?.analysis_engine || "Essentia"} + AI`;

      // Keep Essentia numeric metrics, enrich only AI-derived metadata
      const { error: enrichErr } = await supabaseAdmin
        .from("vocal_dna")
        .update({
          vocal_range_low: vdna.vocalRangeLow,
          vocal_range_high: vdna.vocalRangeHigh,
          vocal_classification: vdna.vocalClassification,
          tone_profiles: vdna.toneProfiles,
          genre_probabilities: vdna.genreProbabilities,
          analysis_status: "signal_analyzed",
          analysis_engine: enrichedEngine,
          is_placeholder: false,
        })
        .eq("submission_id", submissionId);

      if (enrichErr) {
        console.error("Failed to enrich vocal DNA:", enrichErr);
      } else {
        console.log("Enriched existing Essentia vocal DNA with AI metadata");
      }

      responseVocalDNA = {
        vocalRangeLow: vdna.vocalRangeLow,
        vocalRangeHigh: vdna.vocalRangeHigh,
        vocalClassification: vdna.vocalClassification,
        pitchAccuracy: Number(existingDna?.pitch_accuracy ?? vdna.pitchAccuracy),
        rhythmTiming: Number(existingDna?.rhythm_timing ?? vdna.rhythmTiming),
        toneProfiles: vdna.toneProfiles,
        genreProbabilities: vdna.genreProbabilities,
        performanceEnergy: Number(existingDna?.performance_energy ?? vdna.performanceEnergy),
        isPlaceholder: false,
        analysisEngine: enrichedEngine,
        timingAccuracy: Number(existingDna?.timing_accuracy ?? existingDna?.rhythm_timing ?? vdna.rhythmTiming),
        tempoBpm: Number(existingDna?.tempo_bpm ?? 0),
        energyScore: Number(existingDna?.energy_score ?? existingDna?.performance_energy ?? vdna.performanceEnergy),
        spectralBrightness: Number(existingDna?.spectral_brightness ?? 0),
        dynamicRange: Number(existingDna?.dynamic_range ?? 0),
        onsetStrength: Number(existingDna?.onset_strength ?? 0),
        vocalConfidence: Number(existingDna?.vocal_confidence ?? 0),
      };
    } else {
      // No Essentia data — save full AI-estimated profile
      const { error: dnaErr } = await supabaseAdmin.from("vocal_dna").upsert({
        submission_id: submissionId,
        vocal_range_low: vdna.vocalRangeLow,
        vocal_range_high: vdna.vocalRangeHigh,
        vocal_classification: vdna.vocalClassification,
        pitch_accuracy: vdna.pitchAccuracy,
        rhythm_timing: vdna.rhythmTiming,
        tone_profiles: vdna.toneProfiles,
        genre_probabilities: vdna.genreProbabilities,
        performance_energy: vdna.performanceEnergy,
        analysis_status: "ai_estimated",
        analysis_engine: "google/gemini-3-flash-preview",
        is_placeholder: true,
      }, { onConflict: "submission_id" });

      if (dnaErr) console.error("Failed to save vocal DNA:", dnaErr);

      responseVocalDNA = {
        vocalRangeLow: vdna.vocalRangeLow,
        vocalRangeHigh: vdna.vocalRangeHigh,
        vocalClassification: vdna.vocalClassification,
        pitchAccuracy: Number(vdna.pitchAccuracy),
        rhythmTiming: Number(vdna.rhythmTiming),
        toneProfiles: vdna.toneProfiles,
        genreProbabilities: vdna.genreProbabilities,
        performanceEnergy: Number(vdna.performanceEnergy),
        isPlaceholder: true,
        analysisEngine: "google/gemini-3-flash-preview",
      };
    }

    // Save Artist Potential Index
    const api = result.artistPotentialIndex;
    const apiOverall = Math.round(
      ((api.commercialAppeal + api.memorability + api.replayValue + api.brandIdentityPotential + api.growthPotential) / 5) * 10
    ) / 10;

    const { error: apiErr } = await supabaseAdmin.from("artist_potential_index").upsert({
      submission_id: submissionId,
      overall_score: apiOverall,
      commercial_appeal: api.commercialAppeal,
      memorability: api.memorability,
      replay_value: api.replayValue,
      brand_identity_potential: api.brandIdentityPotential,
      growth_potential: api.growthPotential,
      market_fit: api.marketFit,
      ai_summary: api.aiSummary,
    }, { onConflict: "submission_id" });
    if (apiErr) console.error("Failed to save API scores:", apiErr);

    // Save Social Breakout Potential
    const sbp = result.socialBreakout;
    const sbpOverall = Math.round(
      ((sbp.hookStrength + sbp.clipability + sbp.emotionalReactivity + sbp.danceCompatibility + sbp.discoveryPotential) / 5) * 10
    ) / 10;

    const { error: sbpErr } = await supabaseAdmin.from("social_breakout_potential").upsert({
      submission_id: submissionId,
      overall_score: sbpOverall,
      hook_strength: sbp.hookStrength,
      clipability: sbp.clipability,
      emotional_reactivity: sbp.emotionalReactivity,
      dance_compatibility: sbp.danceCompatibility,
      discovery_potential: sbp.discoveryPotential,
      ai_summary: sbp.aiSummary,
    }, { onConflict: "submission_id" });
    if (sbpErr) console.error("Failed to save social breakout:", sbpErr);

    await supabaseAdmin.from("submissions").update({ status: "scored" }).eq("id", submissionId);

    return new Response(
      JSON.stringify({
        technicalSkill: result.technicalSkill,
        creativityOriginality: result.creativityOriginality,
        emotionalImpact: result.emotionalImpact,
        potential: result.potential,
        overall,
        feedback: result.feedback,
        vocalDNA: responseVocalDNA,
        artistPotentialIndex: { ...api, overallScore: apiOverall },
        socialBreakout: { ...sbp, overallScore: sbpOverall },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-judge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
