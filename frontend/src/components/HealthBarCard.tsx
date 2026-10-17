import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface HealthBarCardProps {
  category: string;
  planned: number;
  actual: number;
  health: "green" | "yellow" | "red";
}

const healthConfig = {
  green: {
    icon: CheckCircle2,
    barColor: "bg-accent-500",
    bgColor: "bg-accent-50",
    textColor: "text-accent-700",
    label: "On Track",
  },
  yellow: {
    icon: AlertTriangle,
    barColor: "bg-warning-500",
    bgColor: "bg-warning-50",
    textColor: "text-warning-700",
    label: "Caution",
  },
  red: {
    icon: XCircle,
    barColor: "bg-danger-500",
    bgColor: "bg-danger-50",
    textColor: "text-danger-700",
    label: "Over Budget",
  },
};

export default function HealthBarCard({ category, planned, actual, health }: HealthBarCardProps) {
  const config = healthConfig[health];
  const Icon = config.icon;
  const percentage = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const remaining = planned - actual;

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 capitalize">{category}</h3>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
          <Icon className="w-4 h-4" />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-slate-900">${actual.toFixed(0)}</span>
        <span className="text-sm text-slate-500">/ ${planned.toFixed(0)}</span>
      </div>

      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${config.barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className={`text-sm ${remaining < 0 ? "text-danger-600" : "text-slate-500"}`}>
        {remaining < 0
          ? `$${Math.abs(remaining).toFixed(0)} over budget`
          : `$${remaining.toFixed(0)} remaining`}
      </p>
    </div>
  );
}
