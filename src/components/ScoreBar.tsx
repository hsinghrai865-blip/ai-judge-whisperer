import { motion } from "framer-motion";

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  delay?: number;
}

const ScoreBar = ({ label, score, maxScore = 10, delay = 0 }: ScoreBarProps) => {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (percentage >= 80) return "bg-gold";
    if (percentage >= 60) return "bg-emerald";
    if (percentage >= 40) return "bg-sapphire";
    return "bg-muted-foreground";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-secondary-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{score.toFixed(1)}/{maxScore}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default ScoreBar;
