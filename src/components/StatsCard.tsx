import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  delay?: number;
}

const StatsCard = ({ icon: Icon, label, value, trend, delay = 0 }: StatsCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-card rounded-xl border border-border p-5 shadow-card"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-3xl font-serif font-bold text-foreground">{value}</span>
      {trend && <span className="text-xs text-emerald mb-1">{trend}</span>}
    </div>
  </motion.div>
);

export default StatsCard;
