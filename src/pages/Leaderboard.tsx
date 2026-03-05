import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, ArrowLeft, Filter, Crown, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

interface LeaderboardEntry {
  id: string;
  title: string;
  artist: string;
  category: string;
  platform: "casablanca" | "growth-tour";
  overallScore: number;
  technicalSkill: number;
  creativity: number;
  emotionalImpact: number;
  potential: number;
}

type PlatformFilter = "all" | "casablanca" | "growth-tour";
type CategoryFilter = "all" | string;

const rankStyles = [
  { bg: "bg-gradient-gold", text: "text-primary-foreground", icon: Crown, shadow: "shadow-gold" },
  { bg: "bg-secondary", text: "text-foreground", icon: Medal, shadow: "" },
  { bg: "bg-secondary", text: "text-foreground", icon: Star, shadow: "" },
];

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ai_scores")
        .select("*, submissions(*)")
        .order("overall_score", { ascending: false });

      if (error) {
        console.error("Failed to fetch leaderboard:", error);
        setIsLoading(false);
        return;
      }

      const mapped: LeaderboardEntry[] = (data || []).map((s) => ({
        id: s.submission_id,
        title: s.submissions?.title || "",
        artist: s.submissions?.artist_name || "",
        category: s.submissions?.category || "",
        platform: (s.submissions?.platform || "casablanca") as "casablanca" | "growth-tour",
        overallScore: Number(s.overall_score),
        technicalSkill: Number(s.technical_skill),
        creativity: Number(s.creativity_originality),
        emotionalImpact: Number(s.emotional_impact),
        potential: Number(s.potential),
      }));

      const cats = [...new Set(mapped.map((e) => e.category))];
      setCategories(cats);
      setEntries(mapped);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const filtered = entries.filter((e) => {
    if (platformFilter !== "all" && e.platform !== platformFilter) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Hero */}
      <div className="relative h-48 overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
        <div className="relative container mx-auto px-4 h-full flex items-end pb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              <span className="text-gradient-gold">League</span> Table
            </h1>
            <p className="text-muted-foreground mt-1">Top talent ranked across both platforms</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Filter className="w-4 h-4 text-muted-foreground" />
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
          {categories.length > 0 && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <div className="flex gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant={categoryFilter === "all" ? "default" : "secondary"}
                  onClick={() => setCategoryFilter("all")}
                  className={`text-xs ${categoryFilter === "all" ? "bg-gradient-gold text-primary-foreground" : ""}`}
                >
                  All Categories
                </Button>
                {categories.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={categoryFilter === c ? "default" : "secondary"}
                    onClick={() => setCategoryFilter(c)}
                    className={`text-xs capitalize ${categoryFilter === c ? "bg-gradient-gold text-primary-foreground" : ""}`}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-3 animate-pulse opacity-30" />
            <p>Loading leaderboard...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No scored submissions yet. Run AI evaluations first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry, idx) => {
              const rankStyle = idx < 3 ? rankStyles[idx] : null;
              const RankIcon = rankStyle?.icon || null;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`flex items-center gap-4 p-5 rounded-xl border border-border bg-card shadow-card ${rankStyle?.shadow || ""}`}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    rankStyle ? `${rankStyle.bg} ${rankStyle.text}` : "bg-secondary text-muted-foreground"
                  }`}>
                    {RankIcon ? (
                      <RankIcon className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg font-semibold text-foreground truncate">{entry.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span>{entry.artist}</span>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-xs">
                        {entry.platform === "casablanca" ? "Casablanca" : "Growth Tour"}
                      </span>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-xs">
                        {entry.category}
                      </span>
                    </div>
                  </div>

                  {/* Scores Breakdown */}
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-center">
                      <p className="font-medium text-foreground">{entry.technicalSkill.toFixed(1)}</p>
                      <p>Technical</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">{entry.creativity.toFixed(1)}</p>
                      <p>Creative</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">{entry.emotionalImpact.toFixed(1)}</p>
                      <p>Emotion</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">{entry.potential.toFixed(1)}</p>
                      <p>Potential</p>
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                    idx === 0 ? "bg-gradient-gold shadow-gold" : "bg-secondary"
                  }`}>
                    <span className={`text-lg font-bold ${idx === 0 ? "text-primary-foreground" : "text-foreground"}`}>
                      {entry.overallScore.toFixed(1)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
