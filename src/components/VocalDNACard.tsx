import { motion } from "framer-motion";
import { Mic, Music, Zap, Radio, Activity, Gauge, Waves } from "lucide-react";

export interface VocalDNA {
  vocalRangeLow: string;
  vocalRangeHigh: string;
  vocalClassification: string;
  pitchAccuracy: number;
  rhythmTiming: number;
  toneProfiles: string[];
  genreProbabilities: { genre: string; probability: number }[];
  performanceEnergy: number;
  isPlaceholder?: boolean;
  analysisEngine?: string | null;
  // Essentia signal-processed fields
  timingAccuracy?: number;
  tempoBpm?: number;
  energyScore?: number;
  spectralBrightness?: number;
  dynamicRange?: number;
  onsetStrength?: number;
  vocalConfidence?: number;
}

interface VocalDNACardProps {
  data: VocalDNA;
}

const MetricBar = ({ label, value, max = 100, delay = 0, unit = "%", estimated = false }: { label: string; value: number; max?: number; delay?: number; unit?: string; estimated?: boolean }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {estimated && (
          <span className="text-[10px] font-medium text-gold/70 bg-gold/8 px-1.5 py-0.5 rounded-full leading-none">est.</span>
        )}
      </div>
      <span className="text-sm font-bold text-foreground">{value.toFixed(1)}{unit === "%" ? "%" : ` ${unit}`}</span>
    </div>
    {unit === "%" && (
      <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className={`h-full rounded-full shadow-gold ${estimated ? "bg-gradient-gold opacity-60" : "bg-gradient-gold"}`}
        />
      </div>
    )}
  </div>
);

const VocalDNACard = ({ data }: VocalDNACardProps) => {
  const maxGenreProb = Math.max(...data.genreProbabilities.map((g) => g.probability), 1);
  const isSignalProcessed = data.isPlaceholder === false;
  const isEstimated = !isSignalProcessed;
  const hasSignalData = (data.tempoBpm ?? 0) > 0 || (data.spectralBrightness ?? 0) > 0 || (data.vocalConfidence ?? 0) > 0;

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
          <p className="text-xs text-muted-foreground">
            {isSignalProcessed
              ? `Signal-processed by ${data.analysisEngine || "Essentia"}`
              : "AI-estimated vocal profile (not signal-analyzed)"}
          </p>
        </div>
        <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium border ${
          isSignalProcessed
            ? "bg-emerald/10 text-emerald border-emerald/20"
            : "bg-gold/10 text-gold border-gold/20"
        }`}>
          {isSignalProcessed ? "Signal Processed" : "AI Estimated"}
        </span>
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

        {/* Core metrics */}
        <MetricBar label="Pitch Accuracy" value={data.pitchAccuracy} delay={0.5} />
        <MetricBar label="Timing Accuracy" value={data.timingAccuracy ?? data.rhythmTiming} delay={0.6} />

        {/* Essentia signal-processed metrics */}
        {isSignalProcessed && (
          <>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="w-4 h-4 text-gold" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Signal Metrics</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <Gauge className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-2xl font-serif font-bold text-foreground">{(data.tempoBpm ?? 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Tempo BPM</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <Activity className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-2xl font-serif font-bold text-foreground">{(data.vocalConfidence ?? 0).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Vocal Confidence</p>
                </div>
              </div>
            </div>

            <MetricBar label="Spectral Brightness" value={data.spectralBrightness ?? 0} delay={0.7} />
            <MetricBar label="Dynamic Range" value={data.dynamicRange ?? 0} delay={0.8} />
            <MetricBar label="Onset Strength" value={data.onsetStrength ?? 0} delay={0.9} />
          </>
        )}

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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isSignalProcessed ? "Energy Score" : "Performance Energy"}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-serif font-bold text-gradient-gold">
                {(data.energyScore ?? data.performanceEnergy).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/ 10</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VocalDNACard;
