import { TrendingUp, AlertCircle, Lightbulb } from "lucide-react";

interface PredictiveBannerProps {
  safeDailySpend: number;
  velocityWarning: boolean;
  recommendation: string;
  daysUntilExhausted: number | null;
}

export default function PredictiveBanner({
  safeDailySpend,
  velocityWarning,
  recommendation,
  daysUntilExhausted,
}: PredictiveBannerProps) {
  const isWarning = velocityWarning || (daysUntilExhausted !== null && daysUntilExhausted <= 7);

  return (
    <div
      className={`rounded-xl p-5 border transition-all duration-300 ${
        isWarning
          ? "bg-warning-50 border-warning-200"
          : "bg-accent-50 border-accent-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isWarning ? "bg-warning-500 text-white" : "bg-accent-500 text-white"
          }`}
        >
          {isWarning ? <AlertCircle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-medium text-slate-700">Safe Daily Spend</span>
            <span className={`text-2xl font-bold ${isWarning ? "text-warning-700" : "text-accent-700"}`}>
              ${safeDailySpend.toFixed(2)}
            </span>
          </div>

          {daysUntilExhausted !== null && (
            <p className="text-sm text-slate-600 mb-2">
              Budget projected to last <strong>{daysUntilExhausted} days</strong>
            </p>
          )}

          <div className="flex items-start gap-1.5 mt-2">
            <Lightbulb className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">{recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
