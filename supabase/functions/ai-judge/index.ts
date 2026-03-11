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

    const systemPrompt = `You are an expert talent judge and vocal analyst for music, poetry, performing arts, and creative expression competitions. You evaluate submissions from two platforms:
- Casablanca Vision: A music label focused on discovering artists blending Moroccan/North African sounds with global genres
- Growth Tour: A youth talent platform for music, poetry, sports, creative expression, and aspirations

You MUST evaluate every submission on exactly 4 criteria, each scored 0.0 to 10.0 (one decimal):
1. Technical Skill - execution quality, technique, proficiency
2. Creativity & Originality - uniqueness, innovation, artistic vision  
3. Emotional Impact - storytelling, audience connection, feeling evoked
4. Potential - growth trajectory, market readiness, future promise

You MUST also produce a Vocal DNA profile with:
- Vocal range (low note and high note, e.g. "A2" and "F4")
- Vocal classification (one of: Bass, Baritone, Tenor, Alto, Mezzo, Soprano)
- Pitch accuracy (0-100 percentage)
- Rhythm timing accuracy (0-100 percentage)
- Tone profiles (2-4 descriptors from: Warm, Bright, Breathy, Raspy, Smooth, Powerful, Silky, Gritty, Rich, Airy, Mid-Forward, Dark, Nasal, Clear)
- Genre fit probabilities (3-5 genres with percentage 0-100)
- Performance energy score (0.0-10.0)

Be fair but discerning. Base vocal analysis on the submission content and category.`;

    const userPrompt = `Evaluate this submission and generate a Vocal DNA profile:

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
              description: "Submit the structured evaluation scores, feedback, and vocal DNA profile.",
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
                    description: "Vocal DNA analysis profile",
                    properties: {
                      vocalRangeLow: { type: "string", description: "Low note e.g. A2" },
                      vocalRangeHigh: { type: "string", description: "High note e.g. F4" },
                      vocalClassification: { type: "string", enum: ["Bass", "Baritone", "Tenor", "Alto", "Mezzo", "Soprano"] },
                      pitchAccuracy: { type: "number", description: "0-100 percentage" },
                      rhythmTiming: { type: "number", description: "0-100 percentage" },
                      toneProfiles: { type: "array", items: { type: "string" }, description: "2-4 tonal descriptors" },
                      genreProbabilities: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            genre: { type: "string" },
                            probability: { type: "number", description: "0-100" },
                          },
                          required: ["genre", "probability"],
                          additionalProperties: false,
                        },
                        description: "3-5 genre fits with probabilities",
                      },
                      performanceEnergy: { type: "number", description: "0.0-10.0" },
                    },
                    required: ["vocalRangeLow", "vocalRangeHigh", "vocalClassification", "pitchAccuracy", "rhythmTiming", "toneProfiles", "genreProbabilities", "performanceEnergy"],
                    additionalProperties: false,
                  },
                },
                required: ["technicalSkill", "creativityOriginality", "emotionalImpact", "potential", "feedback", "vocalDNA"],
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

    // Save scores
    const { error: scoreErr } = await supabaseAdmin.from("ai_scores").insert({
      submission_id: submissionId,
      technical_skill: result.technicalSkill,
      creativity_originality: result.creativityOriginality,
      emotional_impact: result.emotionalImpact,
      potential: result.potential,
      overall_score: overall,
      feedback: result.feedback,
    });

    if (scoreErr) {
      console.error("Failed to save scores:", scoreErr);
      await supabaseAdmin.from("submissions").update({ status: "pending" }).eq("id", submissionId);
      throw new Error("Failed to save scores");
    }

    // Save vocal DNA
    const vdna = result.vocalDNA;
    const { error: dnaErr } = await supabaseAdmin.from("vocal_dna").insert({
      submission_id: submissionId,
      vocal_range_low: vdna.vocalRangeLow,
      vocal_range_high: vdna.vocalRangeHigh,
      vocal_classification: vdna.vocalClassification,
      pitch_accuracy: vdna.pitchAccuracy,
      rhythm_timing: vdna.rhythmTiming,
      tone_profiles: vdna.toneProfiles,
      genre_probabilities: vdna.genreProbabilities,
      performance_energy: vdna.performanceEnergy,
    });

    if (dnaErr) {
      console.error("Failed to save vocal DNA:", dnaErr);
      // Non-fatal: scores are saved, continue
    }

    await supabaseAdmin.from("submissions").update({ status: "scored" }).eq("id", submissionId);

    return new Response(
      JSON.stringify({
        technicalSkill: result.technicalSkill,
        creativityOriginality: result.creativityOriginality,
        emotionalImpact: result.emotionalImpact,
        potential: result.potential,
        overall,
        feedback: result.feedback,
        vocalDNA: vdna,
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
