import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

const DashboardHeader = () => (
  <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50"
  >
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold text-foreground leading-tight">AI Judge</h1>
          <p className="text-xs text-muted-foreground">Talent Evaluation Platform</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
        <Sparkles className="w-3.5 h-3.5 text-gold" />
        <span className="text-xs font-medium text-gold">AI Engine Active</span>
      </div>
    </div>
  </motion.header>
);

export default DashboardHeader;
