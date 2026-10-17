import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { HealthStatus } from "../types";

interface HealthBarCardProps {
  category: string;
  planned: number;
  actual: number;
  health: HealthStatus;
  currencySymbol?: string;
}

const healthConfig: Record<HealthStatus, {
  icon: typeof CheckCircle2;
  barColor: string;
  bgColor: string;
  textColor: string;
  glow: string;
  label: string;
}> = {
  green: {
    icon: CheckCircle2,
    barColor: "bg-primary-500",
    bgColor: "bg-primary-500/15",
    textColor: "text-primary-400",
    glow: "shadow-primary-500/20",
    label: "On Track",
  },
  yellow: {
    icon: AlertTriangle,
    barColor: "bg-warning-500",
    bgColor: "bg-warning-500/15",
    textColor: "text-warning-400",
    glow: "shadow-warning-500/20",
    label: "Caution",
  },
  red: {
    icon: XCircle,
    barColor: "bg-danger-500",
    bgColor: "bg-danger-500/15",
    textColor: "text-danger-400",
    glow: "shadow-danger-500/20",
    label: "Over Budget",
  },
};

export default function HealthBarCard({
  category,
  planned,
  actual,
  health,
  currencySymbol = "$",
}: HealthBarCardProps) {
  const config = healthConfig[health];
  const Icon = config.icon;
  const percentage = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const remaining = planned - actual;

  return (
    <div className={`glass-card-hover p-5 shadow-lg ${config.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-100 capitalize">{category}</h3>
        <div className={`badge ${config.bgColor} ${config.textColor}`}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-white">{currencySymbol}{actual.toFixed(0)}</span>
        <span className="text-sm text-slate-500">/ {currencySymbol}{planned.toFixed(0)}</span>
      </div>

      <div className="h-2.5 bg-surface-300/50 rounded-full overflow-hidden mb-3 relative">
        <div
          className={`h-full ${config.barColor} rounded-full transition-all duration-700 ease-out relative`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 shimmer-bg rounded-full" />
        </div>
      </div>

      <p className={`text-sm ${remaining < 0 ? "text-danger-400" : "text-slate-400"}`}>
        {remaining < 0
          ? `${currencySymbol}${Math.abs(remaining).toFixed(0)} over budget`
          : `${currencySymbol}${remaining.toFixed(0)} remaining`}
      </p>
    </div>
  );
}
