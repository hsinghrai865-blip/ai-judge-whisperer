import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Music, Sparkles, User, Calendar, Tag, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScoreBar from "./ScoreBar";
import VocalDNACard, { type VocalDNA } from "./VocalDNACard";
import ArtistPotentialCard, { type ArtistPotential } from "./ArtistPotentialCard";
import SocialBreakoutCard, { type SocialBreakout } from "./SocialBreakoutCard";
import AudioUploader from "./AudioUploader";
import AudioAnalysisScores, { type AudioScores } from "./AudioAnalysisScores";
import AnalysisArchitectureCard from "./AnalysisArchitectureCard";
import type { Submission } from "./SubmissionCard";

interface AIScores {
  technicalSkill: number;
  creativityOriginality: number;
  emotionalImpact: number;
  potential: number;
  overall: number;
  feedback: string;
}

interface SubmissionDetailProps {
  submission: Submission;
  scores?: AIScores;
  vocalDNA?: VocalDNA;
  artistPotential?: ArtistPotential;
  socialBreakout?: SocialBreakout;
  onBack: () => void;
  onJudge: () => void;
  isJudging: boolean;
  onRetry?: () => void;
}

const SubmissionDetail = ({ submission, scores, vocalDNA, artistPotential, socialBreakout, onBack, onJudge, isJudging, onRetry }: SubmissionDetailProps) => {
  const [audioScores, setAudioScores] = useState<AudioScores | null>(null);
  const isFailed = submission.audioAnalysisStatus === "failed";
  const isRetrying = submission.audioAnalysisStatus === "analyzing" && submission.status === "judging";

  return (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-6"
  >
    <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
      <ArrowLeft className="w-4 h-4" />
      Back to Queue
    </Button>

    {/* Submission Info */}
    <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
          <Music className="w-7 h-7 text-gold" />
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-2xl font-bold text-foreground">{submission.title}</h2>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{submission.artist}</span>
            <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 capitalize" />{submission.category}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{submission.submittedAt}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
              {submission.platform === "casablanca" ? "Casablanca Vision" : "Growth Tour"}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
              {submission.contentType}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* AI Scores or Judge Button */}
    {scores ? (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="font-serif text-xl font-bold text-foreground">AI Evaluation</h3>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
            <span className="text-xl font-bold text-primary-foreground">{scores.overall.toFixed(1)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <ScoreBar label="Technical Skill" score={scores.technicalSkill} delay={0.1} />
          <ScoreBar label="Creativity & Originality" score={scores.creativityOriginality} delay={0.2} />
          <ScoreBar label="Emotional Impact" score={scores.emotionalImpact} delay={0.3} />
          <ScoreBar label="Potential" score={scores.potential} delay={0.4} />
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground mb-2">AI Feedback</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{scores.feedback}</p>
        </div>
      </motion.div>
    ) : (
      <div className="bg-card rounded-2xl border border-border p-8 shadow-card text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-gold" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-foreground">Ready for AI Evaluation</h3>
          <p className="text-sm text-muted-foreground mt-1">AI will analyze this submission across 4 criteria</p>
        </div>
        <Button
          onClick={onJudge}
          disabled={isJudging}
          className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold px-8"
        >
          {isJudging ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              Evaluating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Run AI Evaluation
            </span>
          )}
        </Button>
      </div>
    )}

    {/* Audio Upload */}
    <AudioUploader
      submissionId={submission.id}
      analysisStatus={submission.contentType === "audio" ? "none" : undefined}
      onAnalysisComplete={(s) => setAudioScores(s)}
    />

    {/* Audio Analysis Scores */}
    {audioScores && <AudioAnalysisScores scores={audioScores} />}

    {/* Vocal DNA Card */}
    {vocalDNA && <VocalDNACard data={vocalDNA} />}

    {/* Artist Potential Index Card */}
    {artistPotential && <ArtistPotentialCard data={artistPotential} />}

    {/* Social Breakout Potential Card */}
    {socialBreakout && <SocialBreakoutCard data={socialBreakout} />}

    {/* Architecture Overview */}
    {scores && <AnalysisArchitectureCard />}
  </motion.div>
  );
};

export default SubmissionDetail;
