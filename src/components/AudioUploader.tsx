import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle, AlertCircle, Loader2, FileAudio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AudioScores } from "./AudioAnalysisScores";

type UploadStatus = "idle" | "uploading" | "uploaded" | "analyzing" | "complete" | "failed";

const statusConfig: Record<UploadStatus, { label: string; color: string; icon: React.ElementType }> = {
  idle: { label: "Ready to upload", color: "text-muted-foreground", icon: Upload },
  uploading: { label: "Uploading…", color: "text-gold", icon: Loader2 },
  uploaded: { label: "Sending to analysis engine…", color: "text-gold", icon: Loader2 },
  analyzing: { label: "Analyzing audio…", color: "text-gold", icon: Loader2 },
  complete: { label: "Analysis complete", color: "text-emerald", icon: CheckCircle },
  failed: { label: "Analysis failed", color: "text-destructive", icon: AlertCircle },
};

interface AudioUploaderProps {
  submissionId: string;
  existingAudioUrl?: string | null;
  analysisStatus?: string;
  onAnalysisComplete?: (scores: AudioScores) => void;
}

const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/webm", "audio/flac"];
const MAX_SIZE = 50 * 1024 * 1024;

const AudioUploader = ({ submissionId, existingAudioUrl, analysisStatus, onAnalysisComplete }: AudioUploaderProps) => {
  const [status, setStatus] = useState<UploadStatus>(
    analysisStatus === "complete" ? "complete" :
    analysisStatus === "analyzing" ? "analyzing" :
    analysisStatus === "failed" ? "failed" :
    existingAudioUrl ? "complete" : "idle"
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload an audio file (MP3, WAV, M4A, AAC, OGG, FLAC, WebM)", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 50MB", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setStatus("uploading");
    setErrorMsg(null);

    const filePath = `${submissionId}/${Date.now()}-${file.name}`;

    try {
      // 1. Upload to storage
      const { data, error } = await supabase.storage
        .from("audio-submissions")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("audio-submissions")
        .getPublicUrl(data.path);

      // Update submission with audio URL
      await supabase
        .from("submissions")
        .update({ audio_url: urlData.publicUrl, audio_analysis_status: "uploaded" })
        .eq("id", submissionId);

      setStatus("analyzing");

      // 2. Send to analysis engine via edge function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("analyze-audio", {
        body: { submissionId, audioUrl: urlData.publicUrl },
      });

      if (analysisError) throw analysisError;
      if (analysisData?.error) throw new Error(analysisData.error);

      setStatus("complete");
      toast({ title: "Analysis complete", description: "Audio has been analyzed successfully." });

      if (analysisData?.scores) {
        onAnalysisComplete?.(analysisData.scores);
      }
    } catch (err: any) {
      console.error("Upload/analysis error:", err);
      setStatus("failed");
      setErrorMsg(err.message || "Something went wrong");
      toast({ title: "Analysis failed", description: err.message || "Something went wrong", variant: "destructive" });
    }
  }, [submissionId, toast, onAnalysisComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const StatusIcon = statusConfig[status].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative rounded-2xl border border-border bg-card p-6 shadow-card overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
          <FileAudio className="w-4.5 h-4.5 text-gold" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">Audio Upload</h3>
          <p className="text-xs text-muted-foreground">Upload audio for real-time signal analysis</p>
        </div>
      </div>

      {status === "idle" || status === "failed" ? (
        <div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold/30 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">Drag & drop audio file or click to browse</p>
            <p className="text-xs text-muted-foreground/60">MP3, WAV, M4A, AAC, OGG, FLAC • Max 50MB</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
          {status === "failed" && errorMsg && (
            <p className="text-xs text-destructive mt-3">{errorMsg}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${statusConfig[status].color} ${
            ["uploading", "uploaded", "analyzing"].includes(status) ? "animate-spin" : ""
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${statusConfig[status].color}`}>
              {statusConfig[status].label}
            </p>
            {fileName && <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AudioUploader;
