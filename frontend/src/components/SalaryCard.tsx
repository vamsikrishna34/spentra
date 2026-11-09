import { useState } from "react";
import { Banknote, Loader2, PencilLine, PiggyBank, Plus } from "lucide-react";
import { convertFromUSD, convertToUSD, formatCurrency, getCurrencySymbol } from "../services/mockData";

interface SalaryCardProps {
  salary: number;
  totalSpent: number;
  currency: string;
  onSave: (monthlyAmountUSD: number) => Promise<void>;
}

export default function SalaryCard({ salary, totalSpent, currency, onSave }: SalaryCardProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSalary = salary > 0;
  const savings = salary - totalSpent;
  const savingsPct = hasSalary ? Math.min((savings / salary) * 100, 100) : 0;

  const startEdit = () => {
    setInput(hasSalary ? String(Number(convertFromUSD(salary, currency).toFixed(2))) : "");
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    const value = Number(input);
    if (input.trim() === "" || !Number.isFinite(value) || value < 0) {
      setError("Enter an amount of 0 or more.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(convertToUSD(value, currency));
      setEditing(false);
    } catch {
      setError("Couldn't save your salary. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Monthly salary</p>
            {!editing && (
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-white tabular-nums">
                  {hasSalary ? formatCurrency(salary, currency) : "Not set"}
                </p>
                <button
                  onClick={startEdit}
                  className="btn-ghost p-1"
                  aria-label="Edit monthly salary"
                >
                  <PencilLine className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {hasSalary && !editing && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Savings</p>
              <p className={`text-xl font-bold tabular-nums ${savings >= 0 ? "text-primary-400" : "text-danger-400"}`}>
                {formatCurrency(savings, currency)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-accent-500/15 text-accent-400 flex items-center justify-center flex-shrink-0">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 text-sm">{getCurrencySymbol(currency)}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field py-1.5 text-sm w-40"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSave()}
              autoFocus
              aria-label="Monthly salary amount"
              disabled={saving}
            />
            <button onClick={handleSave} disabled={saving} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
            <button onClick={cancelEdit} disabled={saving} className="btn-secondary px-3 py-1.5 text-xs">
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-danger-400 mt-2">{error}</p>}
        </div>
      )}

      {!hasSalary && !editing && (
        <div className="mt-4">
          <p className="text-sm text-slate-500 mb-3">Add your monthly salary to see how much you're saving.</p>
          <button onClick={startEdit} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add your salary
          </button>
        </div>
      )}

      {hasSalary && !editing && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 tabular-nums">
            <span>{savingsPct.toFixed(0)}% of salary saved</span>
            <span>{formatCurrency(totalSpent, currency)} spent</span>
          </div>
          <div className="h-2.5 bg-surface-300/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${savings >= 0 ? "bg-primary-500" : "bg-danger-500"}`}
              style={{ width: `${Math.max(0, savingsPct)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {savings >= 0
              ? `You've saved ${formatCurrency(savings, currency)} of your ${formatCurrency(salary, currency)} salary this month.`
              : `You're ${formatCurrency(Math.abs(savings), currency)} over your ${formatCurrency(salary, currency)} salary this month.`}
          </p>
        </div>
      )}
    </div>
  );
}
