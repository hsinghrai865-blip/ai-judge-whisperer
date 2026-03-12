import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    const expectedSecret = Deno.env.get("SYNC_SECRET");

    if (!expectedSecret || secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch scored submissions
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("*")
      .eq("status", "scored");

    if (subError) throw subError;
    if (!submissions?.length) {
      return new Response(JSON.stringify({ data: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = submissions.map((s: any) => s.id);

    // Fetch all related data in parallel
    const [aiRes, vocalRes, artistRes, socialRes] = await Promise.all([
      supabase.from("ai_scores").select("*").in("submission_id", ids),
      supabase.from("vocal_dna").select("*").in("submission_id", ids),
      supabase.from("artist_potential_index").select("*").in("submission_id", ids),
      supabase.from("social_breakout_potential").select("*").in("submission_id", ids),
    ]);

    // Index by submission_id
    const index = (rows: any[]) =>
      Object.fromEntries((rows || []).map((r: any) => [r.submission_id, r]));

    const aiMap = index(aiRes.data);
    const vocalMap = index(vocalRes.data);
    const artistMap = index(artistRes.data);
    const socialMap = index(socialRes.data);

    const result = submissions.map((s: any) => ({
      ...s,
      ai_scores: aiMap[s.id] || null,
      vocal_dna: vocalMap[s.id] || null,
      artist_potential_index: artistMap[s.id] || null,
      social_breakout_potential: socialMap[s.id] || null,
    }));

    return new Response(JSON.stringify({ data: result, count: result.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-scores error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
