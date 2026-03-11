import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import ScoreBar from "./ScoreBar";

export interface AudioScores {
  pitch_accuracy: number;
  rhythm_stability: number;
  tone_quality: number;
  overall_score: number;
}

interface AudioAnalysisScoresProps {
  scores: AudioScores;
}

const AudioAnalysisScores = ({ scores }: AudioAnalysisScoresProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-5"
  >
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center">
        <Activity className="w-4.5 h-4.5 text-emerald" />
      </div>
      <div className="flex-1">
        <h3 className="font-serif text-lg font-bold text-foreground">Audio Analysis</h3>
        <p className="text-xs text-muted-foreground">Signal-processed by Casablanca Audio Engine</p>
      </div>
      <div className="w-14 h-14 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
        <span className="text-lg font-bold text-primary-foreground">
          {scores.overall_score?.toFixed(1)}
        </span>
      </div>
    </div>

    <div className="space-y-4">
      <ScoreBar label="Pitch Accuracy" score={scores.pitch_accuracy} maxScore={100} delay={0.1} />
      <ScoreBar label="Rhythm Stability" score={scores.rhythm_stability} maxScore={100} delay={0.2} />
      <ScoreBar label="Tone Quality" score={scores.tone_quality} maxScore={100} delay={0.3} />
    </div>
  </motion.div>
);

export default AudioAnalysisScores;
