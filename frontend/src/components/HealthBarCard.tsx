import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { convertFromUSD, getCurrencySymbol } from "../services/mockData";
import type { HealthStatus } from "../types";

interface HealthBarCardProps {
  category: string;
  planned: number;
  actual: number;
  health: HealthStatus;
  currency?: string;
}

const healthConfig: Record<HealthStatus, {
  icon: typeof CheckCircle2;
  barColor: string;
  bgColor: string;
  textColor: string;
  label: string;
}> = {
  green: { icon: CheckCircle2, barColor: "bg-primary-500", bgColor: "bg-primary-500/10", textColor: "text-primary-700", label: "On track" },
  yellow: { icon: AlertTriangle, barColor: "bg-warning-500", bgColor: "bg-warning-500/10", textColor: "text-warning-700", label: "Caution" },
  red: { icon: XCircle, barColor: "bg-danger-500", bgColor: "bg-danger-500/10", textColor: "text-danger-700", label: "Over budget" },
};

export default function HealthBarCard({ category, planned, actual, health, currency = "INR" }: HealthBarCardProps) {
  const config = healthConfig[health];
  const Icon = config.icon;
  const percentage = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const remaining = planned - actual;
  const symbol = getCurrencySymbol(currency);
  const actualDisplay = convertFromUSD(actual, currency);
  const plannedDisplay = convertFromUSD(planned, currency);
  const remainingDisplay = convertFromUSD(Math.abs(remaining), currency);
  const utilityLabel = remaining < 0
    ? `${symbol}${remainingDisplay.toFixed(0)} over`
    : `${symbol}${remainingDisplay.toFixed(0)} left`;

  return (
    <div className="budget-health-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100 capitalize">{category}</h3>
        <div className={`micro-badge ${config.bgColor} ${config.textColor}`}>
          <Icon className="w-3.5 h-3.5" />
          {utilityLabel}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-5">
        <span className="metric-value text-2xl">{symbol}{actualDisplay.toFixed(0)}</span>
        <span className="text-xs text-slate-500">of {symbol}{plannedDisplay.toFixed(0)}</span>
      </div>
      <div className="progress-track mt-3">
        <div className={`progress-fill ${config.barColor}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className={`text-xs mt-3 ${remaining < 0 ? "text-danger-600" : "text-slate-500"}`}>
        {remaining < 0 ? "Above monthly limit" : `${config.label} · ${percentage.toFixed(0)}% used`}
      </p>
    </div>
  );
}
