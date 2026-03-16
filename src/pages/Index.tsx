import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, CheckCircle, BarChart3, Sparkles, Filter, RefreshCw, TrendingUp, ArrowUpDown, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import SubmissionCard, { type Submission } from "@/components/SubmissionCard";
import SubmissionDetail from "@/components/SubmissionDetail";
import type { VocalDNA } from "@/components/VocalDNACard";
import type { ArtistPotential } from "@/components/ArtistPotentialCard";
import type { SocialBreakout } from "@/components/SocialBreakoutCard";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

type FilterType = "all" | "pending" | "judging" | "scored";
type PlatformFilter = "all" | "casablanca" | "growth-tour";
type SortType = "newest" | "highest-ai" | "highest-api" | "highest-smbp" | "highest-commercial" | "highest-growth" | "highest-replay" | "highest-hook";

interface AIScores {
  technicalSkill: number;
  creativityOriginality: number;
  emotionalImpact: number;
  potential: number;
  overall: number;
  feedback: string;
}

const sortLabels: Record<SortType, string> = {
  "newest": "Newest",
  "highest-ai": "AI Score",
  "highest-api": "API",
  "highest-smbp": "Social",
  "highest-commercial": "Commercial",
  "highest-growth": "Growth",
  "highest-replay": "Replay",
  "highest-hook": "Hook",
};

const Index = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scores, setScores] = useState<Record<string, AIScores>>({});
  const [vocalDNAs, setVocalDNAs] = useState<Record<string, VocalDNA>>({});
  const [artistPotentials, setArtistPotentials] = useState<Record<string, ArtistPotential>>({});
  const [socialBreakouts, setSocialBreakouts] = useState<Record<string, SocialBreakout>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const [isJudging, setIsJudging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: subs, error: subErr } = await supabase
        .from("submissions")
        .select("*, ai_scores(*), vocal_dna(*), artist_potential_index(*), social_breakout_potential(*)")
        .order("submitted_at", { ascending: false });

      if (subErr) throw subErr;

      const apiMap: Record<string, ArtistPotential> = {};
      const dnaMap: Record<string, VocalDNA> = {};
      const scoresMap: Record<string, AIScores> = {};
      const sbpMap: Record<string, SocialBreakout> = {};

      const mapped: Submission[] = (subs || []).map((s: any) => {
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

        const vd = s.vocal_dna?.[0];
        if (vd) {
          dnaMap[s.id] = {
            vocalRangeLow: vd.vocal_range_low,
            vocalRangeHigh: vd.vocal_range_high,
            vocalClassification: vd.vocal_classification,
            pitchAccuracy: Number(vd.pitch_accuracy),
            rhythmTiming: Number(vd.rhythm_timing),
            toneProfiles: vd.tone_profiles,
            genreProbabilities: vd.genre_probabilities as { genre: string; probability: number }[],
            performanceEnergy: Number(vd.performance_energy),
            isPlaceholder: (vd as any).is_placeholder ?? true,
            analysisEngine: (vd as any).analysis_engine ?? null,
            timingAccuracy: Number((vd as any).timing_accuracy ?? 0),
            tempoBpm: Number((vd as any).tempo_bpm ?? 0),
            energyScore: Number((vd as any).energy_score ?? 0),
            spectralBrightness: Number((vd as any).spectral_brightness ?? 0),
            dynamicRange: Number((vd as any).dynamic_range ?? 0),
            onsetStrength: Number((vd as any).onset_strength ?? 0),
            vocalConfidence: Number((vd as any).vocal_confidence ?? 0),
          };
        }

        const ap = s.artist_potential_index?.[0];
        if (ap) {
          apiMap[s.id] = {
            overallScore: Number(ap.overall_score),
            commercialAppeal: Number(ap.commercial_appeal),
            memorability: Number(ap.memorability),
            replayValue: Number(ap.replay_value),
            brandIdentityPotential: Number(ap.brand_identity_potential),
            growthPotential: Number(ap.growth_potential),
            marketFit: ap.market_fit as { market: string; confidence: number }[],
            aiSummary: ap.ai_summary,
          };
        }

        const sb = s.social_breakout_potential?.[0];
        if (sb) {
          sbpMap[s.id] = {
            overallScore: Number(sb.overall_score),
            hookStrength: Number(sb.hook_strength),
            clipability: Number(sb.clipability),
            emotionalReactivity: Number(sb.emotional_reactivity),
            danceCompatibility: Number(sb.dance_compatibility),
            discoveryPotential: Number(sb.discovery_potential),
            aiSummary: sb.ai_summary,
          };
        }

        return {
          id: s.id,
          title: s.title,
          artist: s.artist_name,
          category: s.category,
          platform: s.platform as "casablanca" | "growth-tour",
          status: s.status as "pending" | "judging" | "scored",
          overallScore: sc ? Number(sc.overall_score) : undefined,
          apiScore: ap ? Number(ap.overall_score) : undefined,
          smbpScore: sb ? Number(sb.overall_score) : undefined,
          submittedAt: new Date(s.submitted_at).toLocaleDateString(),
          contentType: s.content_type,
          audioAnalysisStatus: s.audio_analysis_status,
        };
      });

      setSubmissions(mapped);
      setScores(scoresMap);
      setVocalDNAs(dnaMap);
      setArtistPotentials(apiMap);
      setSocialBreakouts(sbpMap);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    let list = submissions.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (platformFilter !== "all" && s.platform !== platformFilter) return false;
      return true;
    });

    if (sortBy !== "newest") {
      list = [...list].sort((a, b) => {
        switch (sortBy) {
          case "highest-ai":
            return (b.overallScore ?? 0) - (a.overallScore ?? 0);
          case "highest-api":
            return (b.apiScore ?? 0) - (a.apiScore ?? 0);
          case "highest-smbp":
            return (b.smbpScore ?? 0) - (a.smbpScore ?? 0);
          case "highest-commercial":
            return (artistPotentials[b.id]?.commercialAppeal ?? 0) - (artistPotentials[a.id]?.commercialAppeal ?? 0);
          case "highest-growth":
            return (artistPotentials[b.id]?.growthPotential ?? 0) - (artistPotentials[a.id]?.growthPotential ?? 0);
          case "highest-replay":
            return (artistPotentials[b.id]?.replayValue ?? 0) - (artistPotentials[a.id]?.replayValue ?? 0);
          case "highest-hook":
            return (socialBreakouts[b.id]?.hookStrength ?? 0) - (socialBreakouts[a.id]?.hookStrength ?? 0);
          default:
            return 0;
        }
      });
    }

    return list;
  }, [submissions, filter, platformFilter, sortBy, artistPotentials, socialBreakouts]);

  const selected = submissions.find((s) => s.id === selectedId);

  const handleJudge = async () => {
    if (!selected) return;
    setIsJudging(true);

    setSubmissions((prev) =>
      prev.map((s) => (s.id === selected.id ? { ...s, status: "judging" as const } : s))
    );

    try {
      const { data, error } = await supabase.functions.invoke("ai-judge", {
        body: { submissionId: selected.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setScores((prev) => ({ ...prev, [selected.id]: data }));
      if (data.vocalDNA) {
        setVocalDNAs((prev) => ({ ...prev, [selected.id]: data.vocalDNA }));
      }
      if (data.artistPotentialIndex) {
        setArtistPotentials((prev) => ({ ...prev, [selected.id]: data.artistPotentialIndex }));
      }
      if (data.socialBreakout) {
        setSocialBreakouts((prev) => ({ ...prev, [selected.id]: data.socialBreakout }));
      }
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selected.id
            ? {
                ...s,
                status: "scored" as const,
                overallScore: data.overall,
                apiScore: data.artistPotentialIndex?.overallScore,
                smbpScore: data.socialBreakout?.overallScore,
              }
            : s
        )
      );

      toast({
        title: "AI Evaluation Complete",
        description: `${selected.title} — AI: ${data.overall}/10 | API: ${data.artistPotentialIndex?.overallScore?.toFixed(1) ?? "N/A"} | Social: ${data.socialBreakout?.overallScore?.toFixed(1) ?? "N/A"}`,
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
  const apiScoredSubs = submissions.filter((s) => s.apiScore !== undefined);
  const smbpScoredSubs = submissions.filter((s) => s.smbpScore !== undefined);
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    scored: scoredSubs.length,
    avgScore: scoredSubs.length > 0
      ? scoredSubs.reduce((a, s) => a + (s.overallScore || 0), 0) / scoredSubs.length
      : 0,
    avgApi: apiScoredSubs.length > 0
      ? apiScoredSubs.reduce((a, s) => a + (s.apiScore || 0), 0) / apiScoredSubs.length
      : 0,
    avgSmbp: smbpScoredSubs.length > 0
      ? smbpScoredSubs.reduce((a, s) => a + (s.smbpScore || 0), 0) / smbpScoredSubs.length
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard icon={Inbox} label="Total" value={stats.total} delay={0} />
          <StatsCard icon={Sparkles} label="Pending" value={stats.pending} delay={0.1} />
          <StatsCard icon={CheckCircle} label="Scored" value={stats.scored} delay={0.2} />
          <StatsCard icon={BarChart3} label="Avg AI" value={stats.avgScore.toFixed(1)} delay={0.3} />
          <StatsCard icon={TrendingUp} label="Avg API" value={stats.avgApi.toFixed(1)} delay={0.4} />
          <StatsCard icon={Share2} label="Avg Social" value={stats.avgSmbp.toFixed(1)} delay={0.5} />
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <SubmissionDetail
              key="detail"
              submission={selected}
              scores={scores[selected.id]}
              vocalDNA={vocalDNAs[selected.id]}
              artistPotential={artistPotentials[selected.id]}
              socialBreakout={socialBreakouts[selected.id]}
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
                <div className="w-px h-6 bg-border mx-1" />
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="flex gap-1.5 flex-wrap">
                  {(Object.keys(sortLabels) as SortType[]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={sortBy === s ? "default" : "secondary"}
                      onClick={() => setSortBy(s)}
                      className={`text-xs ${sortBy === s ? "bg-gradient-gold text-primary-foreground" : ""}`}
                    >
                      {sortLabels[s]}
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
