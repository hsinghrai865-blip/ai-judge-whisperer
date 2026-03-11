import { motion } from "framer-motion";
import { TrendingUp, Zap, Star, RotateCcw, Fingerprint, Sprout, Globe } from "lucide-react";

export interface ArtistPotential {
  overallScore: number;
  commercialAppeal: number;
  memorability: number;
  replayValue: number;
  brandIdentityPotential: number;
  growthPotential: number;
  marketFit: { market: string; confidence: number }[];
  aiSummary: string;
}

interface ArtistPotentialCardProps {
  data: ArtistPotential;
}

const ScoreDimension = ({
  icon: Icon,
  label,
  score,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    className="flex items-center gap-3"
  >
    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-gold" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-gold"
          />
        </div>
        <span className="text-sm font-bold text-foreground w-8 text-right">{score.toFixed(1)}</span>
      </div>
    </div>
  </motion.div>
);

const ArtistPotentialCard = ({ data }: ArtistPotentialCardProps) => {
  const scoreColor =
    data.overallScore >= 8
      ? "from-gold to-gold-glow"
      : data.overallScore >= 6
        ? "from-gold/80 to-gold"
        : "from-muted-foreground to-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative rounded-2xl border border-border bg-card p-8 shadow-card overflow-hidden"
    >
      {/* Glow effects */}
      <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gold/4 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-gold/3 blur-3xl pointer-events-none" />

      {/* Header with overall score */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shadow-gold">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-foreground">Artist Potential Index</h3>
            <p className="text-xs text-muted-foreground">AI-powered breakout potential analysis</p>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
          className={`w-18 h-18 rounded-full bg-gradient-to-br ${scoreColor} flex items-center justify-center shadow-gold relative`}
          style={{ width: "4.5rem", height: "4.5rem" }}
        >
          <div className="absolute inset-0 rounded-full bg-gold/20 animate-pulse" style={{ animationDuration: "3s" }} />
          <div className="text-center relative">
            <span className="text-xl font-bold text-primary-foreground">{data.overallScore.toFixed(1)}</span>
          </div>
        </motion.div>
      </div>

      {/* Score dimensions */}
      <div className="space-y-4 mb-6 relative">
        <ScoreDimension icon={Zap} label="Commercial Appeal" score={data.commercialAppeal} delay={0.5} />
        <ScoreDimension icon={Star} label="Memorability" score={data.memorability} delay={0.6} />
        <ScoreDimension icon={RotateCcw} label="Replay Value" score={data.replayValue} delay={0.7} />
        <ScoreDimension icon={Fingerprint} label="Brand Identity Potential" score={data.brandIdentityPotential} delay={0.8} />
        <ScoreDimension icon={Sprout} label="Growth Potential" score={data.growthPotential} delay={0.9} />
      </div>

      {/* Market Fit */}
      <div className="mb-6 relative">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Fit</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.marketFit.map((m, i) => (
            <motion.span
              key={m.market}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.0 + i * 0.08 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20"
            >
              {m.market}
              <span className="text-gold/60">{m.confidence}%</span>
            </motion.span>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="pt-5 border-t border-border relative"
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">AI Summary</p>
        <p className="text-sm text-secondary-foreground leading-relaxed italic">
          &ldquo;{data.aiSummary}&rdquo;
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ArtistPotentialCard;
