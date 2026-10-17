import { TrendingUp, AlertCircle, Lightbulb, Gauge } from "lucide-react";
import { formatCurrency } from "../services/mockData";

interface PredictiveBannerProps {
  safeDailySpend: number;
  velocityWarning: boolean;
  recommendation: string;
  daysUntilExhausted: number | null;
  projectedTotal?: number;
  currency?: string;
}

export default function PredictiveBanner({
  safeDailySpend,
  velocityWarning,
  recommendation,
  daysUntilExhausted,
  projectedTotal,
  currency = "USD",
}: PredictiveBannerProps) {
  const isWarning = velocityWarning || (daysUntilExhausted !== null && daysUntilExhausted <= 7);

  return (
    <div
      className={`glass-card p-5 border transition-all duration-300 animate-slide-up ${
        isWarning
          ? "border-warning-500/30 bg-warning-500/5"
          : "border-primary-500/30 bg-primary-500/5"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            isWarning
              ? "bg-warning-500/20 text-warning-400"
              : "bg-primary-500/20 text-primary-400 animate-glow-pulse"
          }`}
        >
          {isWarning ? <AlertCircle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Safe Daily Spend</span>
            <span
              className={`text-2xl font-bold ${isWarning ? "text-warning-400" : "text-primary-400 neon-text"}`}
            >
              {formatCurrency(safeDailySpend, currency)}
            </span>
            {projectedTotal !== undefined && (
              <span className="text-xs text-slate-500 ml-auto">
                Projected: {formatCurrency(projectedTotal, currency)}
              </span>
            )}
          </div>

          {daysUntilExhausted !== null && daysUntilExhausted > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-2">
              <Gauge className="w-3.5 h-3.5" />
              Budget lasts ~{daysUntilExhausted} more days at current pace
            </div>
          )}

          {daysUntilExhausted === 0 && (
            <div className="flex items-center gap-1.5 text-sm text-danger-400 mb-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Budget exhausted — spending exceeded limits
            </div>
          )}

          <div className="flex items-start gap-1.5 mt-1.5">
            <Lightbulb className="w-4 h-4 text-primary-400/60 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300">{recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
