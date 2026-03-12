import { motion } from "framer-motion";
import { Server, Cpu, Database, Globe, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";

const AnalysisArchitectureCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.5 }}
    className="relative rounded-2xl border border-border bg-card p-8 shadow-card overflow-hidden"
  >
    <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-sapphire/5 blur-3xl pointer-events-none" />

    {/* Header */}
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-sapphire/10 flex items-center justify-center">
        <Server className="w-5 h-5 text-sapphire" />
      </div>
      <div>
        <h3 className="font-serif text-xl font-bold text-foreground">Analysis Architecture</h3>
        <p className="text-xs text-muted-foreground">Backend integration readiness overview</p>
      </div>
    </div>

    {/* Pipeline visualization */}
    <div className="space-y-4">
      {/* What's built */}
      <div>
        <p className="text-xs font-medium text-emerald uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3" /> Active & Operational
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: Cpu, label: "Essentia Engine (Railway) — pitch, rhythm, spectral analysis" },
            { icon: Database, label: "Vocal DNA database with full signal metrics" },
            { icon: Globe, label: "Audio upload to cloud storage" },
            { icon: Cpu, label: "AI enrichment layer (Gemini) — vocal range, tone, genre fit" },
            { icon: Server, label: "Processing status pipeline UI" },
            { icon: Server, label: "Automated email feedback to artists" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald/5 border border-emerald/10">
              <item.icon className="w-3.5 h-3.5 text-emerald mt-0.5 shrink-0" />
              <span className="text-xs text-foreground/80">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Integration flow */}
      <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Live Processing Pipeline</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {["Upload Audio", "Store in Cloud", "Essentia Analysis", "Save Vocal DNA", "AI Judge Enrichment", "Email Results"].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-card border border-border text-foreground/80">{step}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

export default AnalysisArchitectureCard;
