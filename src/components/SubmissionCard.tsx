import { motion } from "framer-motion";
import { Music, Mic2, Film, Trophy, Palette, Heart, Clock, CheckCircle, Loader2, AlertCircle, RotateCcw } from "lucide-react";

export interface Submission {
  id: string;
  title: string;
  artist: string;
  category: string;
  platform: "casablanca" | "growth-tour";
  status: "pending" | "judging" | "scored";
  overallScore?: number;
  apiScore?: number;
  smbpScore?: number;
  submittedAt: string;
  contentType: string;
  audioAnalysisStatus?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  music: Music,
  poetry: Mic2,
  dreams: Film,
  aspirations: Heart,
  sports: Trophy,
  creative: Palette,
};

const statusConfig = {
  pending: { icon: Clock, label: "Pending", className: "text-muted-foreground bg-muted" },
  judging: { icon: Loader2, label: "AI Judging", className: "text-gold bg-gold/10 animate-pulse-gold" },
  scored: { icon: CheckCircle, label: "Scored", className: "text-emerald bg-emerald/10" },
};

interface SubmissionCardProps {
  submission: Submission;
  index: number;
  onClick?: () => void;
}

const SubmissionCard = ({ submission, index, onClick }: SubmissionCardProps) => {
  const CategoryIcon = categoryIcons[submission.category] || Music;
  const status = statusConfig[submission.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className="group relative bg-card rounded-xl border border-border p-5 hover:border-gold/30 transition-all duration-300 cursor-pointer shadow-card hover:shadow-gold"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <CategoryIcon className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold text-foreground truncate group-hover:text-gold transition-colors">
                {submission.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{submission.artist}</p>
            </div>
            {submission.status === "scored" && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {submission.overallScore !== undefined && (
                  <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center" title="AI Score">
                    <span className="text-sm font-bold text-primary-foreground">{submission.overallScore.toFixed(1)}</span>
                  </div>
                )}
                {submission.apiScore !== undefined && (
                  <div className="w-12 h-12 rounded-full bg-secondary border border-gold/30 flex items-center justify-center" title="API Score">
                    <span className="text-sm font-bold text-gold">{submission.apiScore.toFixed(1)}</span>
                  </div>
                )}
                {submission.smbpScore !== undefined && (
                  <div className="w-12 h-12 rounded-full bg-secondary border border-emerald/30 flex items-center justify-center" title="Social Breakout">
                    <span className="text-sm font-bold text-emerald">{submission.smbpScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
              <StatusIcon className={`w-3 h-3 ${submission.status === "judging" ? "animate-spin" : ""}`} />
              {status.label}
            </span>
            <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded-full bg-secondary">
              {submission.platform === "casablanca" ? "Casablanca" : "Growth Tour"}
            </span>
            <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded-full bg-secondary">
              {submission.contentType}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SubmissionCard;
