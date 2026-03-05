import { motion } from "framer-motion";
import { Bot, Sparkles, LogOut, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const DashboardHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-foreground leading-tight">AI Judge</h1>
            <p className="text-xs text-muted-foreground">Talent Evaluation Platform</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-medium text-gold">AI Engine Active</span>
          </div>

          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/leaderboard" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">League Table</span>
            </Link>
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;
