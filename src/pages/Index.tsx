import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, CheckCircle, BarChart3, Sparkles, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import SubmissionCard, { type Submission } from "@/components/SubmissionCard";
import SubmissionDetail from "@/components/SubmissionDetail";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

// Mock submissions — will be replaced with shared DB queries
const initialSubmissions: Submission[] = [
  { id: "1", title: "Desert Wind", artist: "Youssef Amrani", category: "music", platform: "casablanca", status: "scored", overallScore: 8.7, submittedAt: "2026-03-04", contentType: "audio" },
  { id: "2", title: "Voices of Tomorrow", artist: "Amina Diallo", category: "poetry", platform: "growth-tour", status: "scored", overallScore: 9.2, submittedAt: "2026-03-04", contentType: "text" },
  { id: "3", title: "Atlas Groove", artist: "DJ Karim", category: "music", platform: "casablanca", status: "pending", submittedAt: "2026-03-05", contentType: "audio" },
  { id: "4", title: "My Future Dream", artist: "Fatima Zahra", category: "dreams", platform: "growth-tour", status: "pending", submittedAt: "2026-03-05", contentType: "video" },
  { id: "5", title: "Street Dance Fusion", artist: "Omar Benali", category: "creative", platform: "growth-tour", status: "pending", submittedAt: "2026-03-05", contentType: "video" },
  { id: "6", title: "Sahara Blues", artist: "Leila Mansouri", category: "music", platform: "casablanca", status: "scored", overallScore: 7.4, submittedAt: "2026-03-03", contentType: "audio" },
];

const preloadedScores: Record<string, any> = {
  "1": { technicalSkill: 8.5, creativityOriginality: 9.0, emotionalImpact: 8.8, potential: 8.5, overall: 8.7, feedback: "A beautifully crafted piece that blends traditional Moroccan instrumentation with modern production. The melodic progression shows strong compositional maturity. The emotional arc builds effectively, though the bridge section could use more dynamic contrast." },
  "2": { technicalSkill: 8.8, creativityOriginality: 9.5, emotionalImpact: 9.6, potential: 8.9, overall: 9.2, feedback: "Exceptional spoken word piece with vivid imagery and powerful thematic resonance. The rhythm and cadence demonstrate mastery of the craft. The closing stanza delivers a profound emotional punch that lingers." },
  "6": { technicalSkill: 7.2, creativityOriginality: 7.5, emotionalImpact: 7.8, potential: 7.1, overall: 7.4, feedback: "A promising blues-influenced track with authentic tonal quality. The guitar work shows talent but needs more refined technique in the solo passages. Good foundational composition with room for growth." },
};

type FilterType = "all" | "pending" | "judging" | "scored";
type PlatformFilter = "all" | "casablanca" | "growth-tour";

const Index = () => {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [scores, setScores] = useState<Record<string, any>>(preloadedScores);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [isJudging, setIsJudging] = useState(false);
  const { toast } = useToast();

  const filtered = submissions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (platformFilter !== "all" && s.platform !== platformFilter) return false;
    return true;
  });

  const selected = submissions.find((s) => s.id === selectedId);

  const handleJudge = async () => {
    if (!selected) return;
    setIsJudging(true);

    // Update status to judging
    setSubmissions((prev) =>
      prev.map((s) => (s.id === selected.id ? { ...s, status: "judging" as const } : s))
    );

    try {
      const { data, error } = await supabase.functions.invoke("ai-judge", {
        body: {
          submission: {
            title: selected.title,
            artist: selected.artist,
            category: selected.category,
            platform: selected.platform,
            contentType: selected.contentType,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Store scores and update status
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
      // Revert status
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

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    scored: submissions.filter((s) => s.status === "scored").length,
    avgScore:
      submissions.filter((s) => s.overallScore).reduce((a, s) => a + (s.overallScore || 0), 0) /
      (submissions.filter((s) => s.overallScore).length || 1),
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Hero Banner */}
      <div className="relative h-48 overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
        <div className="relative container mx-auto px-4 h-full flex items-end pb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              AI Judging <span className="text-gradient-gold">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">Unified talent evaluation for Casablanca Vision & Growth Tour</p>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
