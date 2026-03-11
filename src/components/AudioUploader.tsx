import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Music, CheckCircle, AlertCircle, Loader2, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UploadStatus = "idle" | "uploading" | "uploaded" | "queued" | "analyzing" | "complete" | "failed";

const statusConfig: Record<UploadStatus, { label: string; color: string; icon: React.ElementType }> = {
  idle: { label: "Ready to upload", color: "text-muted-foreground", icon: Upload },
  uploading: { label: "Uploading…", color: "text-gold", icon: Loader2 },
  uploaded: { label: "Uploaded", color: "text-gold", icon: CheckCircle },
  queued: { label: "Queued for analysis", color: "text-gold", icon: Loader2 },
  analyzing: { label: "Analyzing audio…", color: "text-gold", icon: Loader2 },
  complete: { label: "Analysis complete", color: "text-emerald", icon: CheckCircle },
  failed: { label: "Analysis failed", color: "text-destructive", icon: AlertCircle },
};

interface AudioUploaderProps {
  submissionId: string;
  existingAudioUrl?: string | null;
  analysisStatus?: string;
  onUploadComplete?: (audioUrl: string) => void;
}

const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/webm", "audio/flac"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const AudioUploader = ({ submissionId, existingAudioUrl, analysisStatus, onUploadComplete }: AudioUploaderProps) => {
  const [status, setStatus] = useState<UploadStatus>(
    analysisStatus === "complete" ? "complete" :
    analysisStatus === "analyzing" ? "analyzing" :
    analysisStatus === "queued" ? "queued" :
    analysisStatus === "failed" ? "failed" :
    existingAudioUrl ? "uploaded" : "idle"
  );
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
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
    setProgress(0);

    const filePath = `${submissionId}/${Date.now()}-${file.name}`;

    try {
      const { data, error } = await supabase.storage
        .from("audio-submissions")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("audio-submissions")
        .getPublicUrl(data.path);

      // Update submission with audio URL and set analysis status
      const { error: updateErr } = await supabase
        .from("submissions")
        .update({
          audio_url: urlData.publicUrl,
          audio_analysis_status: "uploaded",
        })
        .eq("id", submissionId);

      if (updateErr) throw updateErr;

      setStatus("uploaded");
      setProgress(100);
      onUploadComplete?.(urlData.publicUrl);

      toast({
        title: "Audio uploaded",
        description: "File uploaded successfully. Audio analysis will require an external processing engine.",
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatus("failed");
      toast({
        title: "Upload failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  }, [submissionId, toast, onUploadComplete]);

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
      {/* Glow accent */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
          <FileAudio className="w-4.5 h-4.5 text-gold" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">Audio Upload</h3>
          <p className="text-xs text-muted-foreground">Upload audio for vocal analysis pipeline</p>
        </div>
      </div>

      {/* Drop zone */}
      {status === "idle" || status === "failed" ? (
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
      ) : (
        <div className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-5 h-5 ${statusConfig[status].color} ${
              ["uploading", "queued", "analyzing"].includes(status) ? "animate-spin" : ""
            }`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${statusConfig[status].color}`}>
                {statusConfig[status].label}
              </p>
              {fileName && <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>}
            </div>
          </div>

          {/* Progress bar */}
          {status === "uploading" && (
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "70%" }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-gold"
              />
            </div>
          )}

          {/* Analysis pipeline status */}
          {(status as string) !== "idle" && (
            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Analysis Pipeline</p>
              <div className="space-y-2.5">
                {[
                  { step: "uploaded", label: "Audio uploaded" },
                  { step: "queued", label: "Queued for analysis" },
                  { step: "analyzing", label: "Signal processing (external engine)" },
                  { step: "complete", label: "Results saved" },
                ].map((s, i) => {
                  const steps = ["uploaded", "queued", "analyzing", "complete"];
                  const currentIdx = steps.indexOf(status);
                  const stepIdx = steps.indexOf(s.step);
                  const isDone = stepIdx < currentIdx || status === "complete";
                  const isCurrent = stepIdx === currentIdx && (status as string) !== "failed";
                  const isPending = stepIdx > currentIdx;

                  return (
                    <div key={s.step} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isDone ? "bg-emerald/20 text-emerald" :
                        isCurrent ? "bg-gold/20 text-gold" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {isDone ? "✓" : isCurrent ? "●" : (i + 1)}
                      </div>
                      <span className={`text-xs ${
                        isDone ? "text-emerald" :
                        isCurrent ? "text-gold" :
                        "text-muted-foreground"
                      }`}>
                        {s.label}
                      </span>
                      {s.step === "analyzing" && isPending && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground ml-auto">
                          External engine required
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Placeholder notice */}
              <div className="mt-4 p-3 rounded-lg bg-gold/5 border border-gold/10">
                <p className="text-xs text-gold/80">
                  <strong>Note:</strong> Real-time audio signal analysis (pitch detection, spectral profiling) requires an external processing engine such as Essentia or Praat running on a dedicated server. Current Vocal DNA data is AI-estimated from metadata, not signal-analyzed.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AudioUploader;
