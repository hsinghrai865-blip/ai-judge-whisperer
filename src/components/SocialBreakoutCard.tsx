import { motion } from "framer-motion";
import { Share2, Flame, Scissors, Heart, Music2, Radar } from "lucide-react";

export interface SocialBreakout {
  overallScore: number;
  hookStrength: number;
  clipability: number;
  emotionalReactivity: number;
  danceCompatibility: number;
  discoveryPotential: number;
  aiSummary: string;
}

interface SocialBreakoutCardProps {
  data: SocialBreakout;
}

const Metric = ({
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
        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-gold shadow-gold"
          />
        </div>
        <span className="text-sm font-bold text-foreground w-8 text-right">{score.toFixed(1)}</span>
      </div>
    </div>
  </motion.div>
);

const SocialBreakoutCard = ({ data }: SocialBreakoutCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.5 }}
    className="relative rounded-2xl border border-border bg-card p-8 shadow-card overflow-hidden"
  >
    {/* Glow */}
    <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gold/4 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-gold/3 blur-3xl pointer-events-none" />

    {/* Header */}
    <div className="flex items-center justify-between mb-8 relative">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shadow-gold">
          <Share2 className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-foreground">Social Breakout Potential</h3>
          <p className="text-xs text-muted-foreground">Viral & short-form platform analysis</p>
        </div>
      </div>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 200 }}
        className="w-[4.5rem] h-[4.5rem] rounded-full bg-gradient-gold flex items-center justify-center shadow-gold relative"
      >
        <div className="absolute inset-0 rounded-full bg-gold/20 animate-pulse" style={{ animationDuration: "3s" }} />
        <span className="text-xl font-bold text-primary-foreground relative">{data.overallScore.toFixed(1)}</span>
      </motion.div>
    </div>

    {/* Metrics */}
    <div className="space-y-4 mb-6 relative">
      <Metric icon={Flame} label="Hook Strength" score={data.hookStrength} delay={0.6} />
      <Metric icon={Scissors} label="Clipability" score={data.clipability} delay={0.7} />
      <Metric icon={Heart} label="Emotional Reactivity" score={data.emotionalReactivity} delay={0.8} />
      <Metric icon={Music2} label="Dance Compatibility" score={data.danceCompatibility} delay={0.9} />
      <Metric icon={Radar} label="Discovery Potential" score={data.discoveryPotential} delay={1.0} />
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

export default SocialBreakoutCard;
