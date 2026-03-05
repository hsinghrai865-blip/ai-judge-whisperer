import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { submission } = await req.json();

    if (!submission) {
      return new Response(JSON.stringify({ error: "Missing submission data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert talent judge for music, poetry, performing arts, and creative expression competitions. You evaluate submissions from two platforms:
- Casablanca Vision: A music label focused on discovering artists blending Moroccan/North African sounds with global genres
- Growth Tour: A youth talent platform for music, poetry, sports, creative expression, and aspirations

You MUST evaluate every submission on exactly 4 criteria, each scored 0.0 to 10.0 (one decimal):
1. Technical Skill - execution quality, technique, proficiency
2. Creativity & Originality - uniqueness, innovation, artistic vision  
3. Emotional Impact - storytelling, audience connection, feeling evoked
4. Potential - growth trajectory, market readiness, future promise

Be fair but discerning. Provide specific, constructive feedback referencing the actual submission content.`;

    const userPrompt = `Evaluate this submission:

Title: ${submission.title}
Artist: ${submission.artist}
Category: ${submission.category}
Platform: ${submission.platform === "casablanca" ? "Casablanca Vision" : "Growth Tour"}
Content Type: ${submission.contentType}
${submission.description ? `Description: ${submission.description}` : ""}
${submission.contentText ? `Content:\n${submission.contentText}` : ""}`;

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
              description: "Submit the structured evaluation scores and feedback for a talent submission.",
              parameters: {
                type: "object",
                properties: {
                  technicalSkill: {
                    type: "number",
                    description: "Score for technical skill/execution (0.0-10.0)",
                  },
                  creativityOriginality: {
                    type: "number",
                    description: "Score for creativity and originality (0.0-10.0)",
                  },
                  emotionalImpact: {
                    type: "number",
                    description: "Score for emotional impact and storytelling (0.0-10.0)",
                  },
                  potential: {
                    type: "number",
                    description: "Score for growth potential and future promise (0.0-10.0)",
                  },
                  feedback: {
                    type: "string",
                    description: "Detailed constructive feedback (2-4 sentences)",
                  },
                },
                required: [
                  "technicalSkill",
                  "creativityOriginality",
                  "emotionalImpact",
                  "potential",
                  "feedback",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "submit_evaluation" },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const scores = JSON.parse(toolCall.function.arguments);

    // Calculate overall score
    const overall =
      (scores.technicalSkill +
        scores.creativityOriginality +
        scores.emotionalImpact +
        scores.potential) /
      4;

    return new Response(
      JSON.stringify({
        ...scores,
        overall: Math.round(overall * 10) / 10,
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
