import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Music, CheckCircle, Loader2, AlertCircle, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ACCEPTED_TYPES = [
  "audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/aac",
  "audio/ogg", "audio/webm", "audio/flac", "video/mp4", "video/quicktime",
];
const MAX_SIZE = 700 * 1024; // 700KB
const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.mp4,.mov";

type FormStatus = "idle" | "submitting" | "success" | "error";

const Submit = () => {
  const [artistName, setArtistName] = useState("");
  const [email, setEmail] = useState("");
  const [genre, setGenre] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 700KB (approx. 1 minute demo)", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !artistName.trim() || !email.trim() || !genre.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields and upload a demo.", variant: "destructive" });
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      // Upload file to storage
      const filePath = `public-demos/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-submissions")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("audio-submissions")
        .getPublicUrl(uploadData.path);

      // Call edge function to create submission and trigger pipeline
      const { data, error } = await supabase.functions.invoke("submit-demo", {
        body: {
          artistName: artistName.trim(),
          email: email.trim(),
          genre: genre.trim(),
          audioUrl: urlData.publicUrl,
          fileName: file.name,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStatus("success");
      toast({ title: "Demo submitted!", description: "Check your email for confirmation." });
    } catch (err: any) {
      console.error("Submission error:", err);
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong");
      toast({ title: "Submission failed", description: err.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
            <Mic2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Submit Your <span className="text-gradient-gold">Demo</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Upload your sound demo for AI-powered analysis by Casablanca Vision
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl border border-border p-8 shadow-card text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald" />
              </div>
              <h2 className="font-serif text-xl font-bold text-foreground">Thank You!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your demo has been submitted successfully. We've sent a confirmation to your email.
                Our AI is now analysing your recording — you'll receive your feedback results shortly.
              </p>
              <Button
                onClick={() => { setStatus("idle"); setFile(null); setArtistName(""); setEmail(""); setGenre(""); }}
                variant="secondary"
                className="mt-4"
              >
                Submit Another Demo
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-5"
            >
              {/* Artist Name */}
              <div className="space-y-2">
                <Label htmlFor="artistName" className="text-foreground">Artist / Stage Name</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Enter your artist name"
                  className="bg-secondary border-border"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-secondary border-border"
                  required
                />
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre" className="text-foreground">Genre</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. R&B, Hip-Hop, Afrobeats, Pop"
                  className="bg-secondary border-border"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-foreground">Sound Demo</Label>
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0]); }}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/30 transition-colors"
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <Music className="w-5 h-5 text-gold" />
                      <span className="text-sm text-foreground font-medium truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)}KB)</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">MP3, WAV, M4A, MP4, AAC • Max 700KB (~1 min)</p>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {status === "error" && errorMsg && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                disabled={status === "submitting" || !file}
                className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold"
              >
                {status === "submitting" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  "Submit Demo"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to have your demo analysed by our AI evaluation system.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Submit;
