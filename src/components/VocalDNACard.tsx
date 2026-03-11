import { motion } from "framer-motion";
import { Mic, Music, Zap, Radio } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface VocalDNA {
  vocalRangeLow: string;
  vocalRangeHigh: string;
  vocalClassification: string;
  pitchAccuracy: number;
  rhythmTiming: number;
  toneProfiles: string[];
  genreProbabilities: { genre: string; probability: number }[];
  performanceEnergy: number;
}

interface VocalDNACardProps {
  data: VocalDNA;
}

const VocalDNACard = ({ data }: VocalDNACardProps) => {
  const maxGenreProb = Math.max(...data.genreProbabilities.map((g) => g.probability), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative rounded-2xl border border-border bg-card p-8 shadow-card overflow-hidden"
    >
      {/* Subtle glow accent */}
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-gold/3 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-7 relative">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shadow-gold">
          <Mic className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-foreground">Vocal DNA</h3>
          <p className="text-xs text-muted-foreground">AI-generated vocal analysis profile</p>
        </div>
      </div>

      <div className="space-y-6 relative">
        {/* Vocal Range */}
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
            <Music className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Vocal Range</p>
            <p className="text-lg font-serif font-bold text-foreground">
              {data.vocalClassification}
              <span className="text-sm font-sans font-normal text-muted-foreground ml-2">
                ({data.vocalRangeLow} – {data.vocalRangeHigh})
              </span>
            </p>
          </div>
        </div>

        {/* Pitch Accuracy */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pitch Accuracy</p>
            <span className="text-sm font-bold text-foreground">{data.pitchAccuracy}%</span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.pitchAccuracy}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-gold shadow-gold"
            />
          </div>
        </div>

        {/* Rhythm Timing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timing Accuracy</p>
            <span className="text-sm font-bold text-foreground">{data.rhythmTiming}%</span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.rhythmTiming}%` }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-gold shadow-gold"
            />
          </div>
        </div>

        {/* Tone Profile */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Tone Profile</p>
          <div className="flex flex-wrap gap-2">
            {data.toneProfiles.map((tone, i) => (
              <motion.span
                key={tone}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + i * 0.08 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20"
              >
                {tone}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Genre Probability */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Genre Fit</p>
          </div>
          <div className="space-y-2.5">
            {data.genreProbabilities.map((g, i) => (
              <div key={g.genre} className="flex items-center gap-3">
                <span className="text-xs text-secondary-foreground w-20 truncate">{g.genre}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(g.probability / maxGenreProb) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.8 + i * 0.1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-gold"
                    style={{ opacity: 0.5 + (g.probability / maxGenreProb) * 0.5 }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right">{g.probability}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Energy */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance Energy</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-serif font-bold text-gradient-gold">{data.performanceEnergy.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">/ 10</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VocalDNACard;
