import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, CheckCircle, BarChart3, Sparkles, Filter, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import SubmissionCard, { type Submission } from "@/components/SubmissionCard";
import SubmissionDetail from "@/components/SubmissionDetail";
import type { VocalDNA } from "@/components/VocalDNACard";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

type FilterType = "all" | "pending" | "judging" | "scored";
type PlatformFilter = "all" | "casablanca" | "growth-tour";

interface AIScores {
  technicalSkill: number;
  creativityOriginality: number;
  emotionalImpact: number;
  potential: number;
  overall: number;
  feedback: string;
}

const Index = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scores, setScores] = useState<Record<string, AIScores>>({});
  const [vocalDNAs, setVocalDNAs] = useState<Record<string, VocalDNA>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [isJudging, setIsJudging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch submissions with their scores and vocal DNA
      const { data: subs, error: subErr } = await supabase
        .from("submissions")
        .select("*, ai_scores(*), vocal_dna(*)")
        .order("submitted_at", { ascending: false });

      if (subErr) throw subErr;

      const mapped: Submission[] = (subs || []).map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist_name,
        category: s.category,
        platform: s.platform as "casablanca" | "growth-tour",
        status: s.status as "pending" | "judging" | "scored",
        overallScore: s.ai_scores?.[0]?.overall_score ?? undefined,
        submittedAt: new Date(s.submitted_at).toLocaleDateString(),
        contentType: s.content_type,
      }));

      const scoresMap: Record<string, AIScores> = {};
      (subs || []).forEach((s) => {
        const sc = s.ai_scores?.[0];
        if (sc) {
          scoresMap[s.id] = {
            technicalSkill: Number(sc.technical_skill),
            creativityOriginality: Number(sc.creativity_originality),
            emotionalImpact: Number(sc.emotional_impact),
            potential: Number(sc.potential),
            overall: Number(sc.overall_score),
            feedback: sc.feedback,
          };
        }
      });

      setSubmissions(mapped);
      setScores(scoresMap);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = submissions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (platformFilter !== "all" && s.platform !== platformFilter) return false;
    return true;
  });

  const selected = submissions.find((s) => s.id === selectedId);

  const handleJudge = async () => {
    if (!selected) return;
    setIsJudging(true);

    // Optimistic UI update
    setSubmissions((prev) =>
      prev.map((s) => (s.id === selected.id ? { ...s, status: "judging" as const } : s))
    );

    try {
      const { data, error } = await supabase.functions.invoke("ai-judge", {
        body: { submissionId: selected.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update local state with real scores
      setScores((prev) => ({ ...prev, [selected.id]: data }));
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selected.id ? { ...s, status: "scored" as const, overallScore: data.overall } : s
        )
      );

      toast({
        title: "AI Evaluation Complete",
        description: `${selected.title} scored ${data.overall}/10`,
      });
    } catch (err: any) {
      console.error("AI Judge error:", err);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === selected.id ? { ...s, status: "pending" as const } : s))
      );
      toast({
        title: "Evaluation Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJudging(false);
    }
  };

  const scoredSubs = submissions.filter((s) => s.overallScore !== undefined);
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    scored: scoredSubs.length,
    avgScore: scoredSubs.length > 0
      ? scoredSubs.reduce((a, s) => a + (s.overallScore || 0), 0) / scoredSubs.length
      : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Hero Banner */}
      <div className="relative h-48 overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
        <div className="relative container mx-auto px-4 h-full flex items-end pb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                  AI Judging <span className="text-gradient-gold">Dashboard</span>
                </h1>
                <p className="text-muted-foreground mt-1">Unified talent evaluation for Casablanca Vision & Growth Tour</p>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchData} className="gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={Inbox} label="Total Submissions" value={stats.total} delay={0} />
          <StatsCard icon={Sparkles} label="Pending Review" value={stats.pending} delay={0.1} />
          <StatsCard icon={CheckCircle} label="Scored" value={stats.scored} delay={0.2} />
          <StatsCard icon={BarChart3} label="Avg Score" value={stats.avgScore.toFixed(1)} delay={0.3} />
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <SubmissionDetail
              key="detail"
              submission={selected}
              scores={scores[selected.id]}
              onBack={() => setSelectedId(null)}
              onJudge={handleJudge}
              isJudging={isJudging}
            />
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-1.5">
                  {(["all", "pending", "judging", "scored"] as FilterType[]).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={filter === f ? "default" : "secondary"}
                      onClick={() => setFilter(f)}
                      className={`text-xs capitalize ${filter === f ? "bg-gradient-gold text-primary-foreground" : ""}`}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
                <div className="w-px h-6 bg-border mx-1" />
                <div className="flex gap-1.5">
                  {(["all", "casablanca", "growth-tour"] as PlatformFilter[]).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={platformFilter === p ? "default" : "secondary"}
                      onClick={() => setPlatformFilter(p)}
                      className={`text-xs capitalize ${platformFilter === p ? "bg-gradient-gold text-primary-foreground" : ""}`}
                    >
                      {p === "growth-tour" ? "Growth Tour" : p === "casablanca" ? "Casablanca" : "All Platforms"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Submission List */}
              {isLoading ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 animate-spin opacity-30" />
                  <p>Loading submissions...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No submissions match your filters</p>
                    </div>
                  ) : (
                    filtered.map((s, i) => (
                      <SubmissionCard key={s.id} submission={s} index={i} onClick={() => setSelectedId(s.id)} />
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
