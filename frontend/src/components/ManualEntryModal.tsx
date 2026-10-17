import { useState } from "react";
import { X, Plus, Tag } from "lucide-react";
import { CATEGORIES, convertToUSD, MOCK_RATES } from "../services/mockData";
import type { TransactionSource } from "../types";

interface ManualEntryModalProps {
  onClose: () => void;
  onSave: (data: Omit<import("../types").Transaction, "id" | "user_id">) => void;
}

export default function ManualEntryModal({ onClose, onSave }: ManualEntryModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState<string>("food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [merchant, setMerchant] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const convertedAmount = convertToUSD(parseFloat(amount) || 0, currency);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = "Description is required";
    if (!amount || parseFloat(amount) <= 0) errs.amount = "Enter a valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      description: description.trim(),
      amount: parseFloat(amount),
      currency,
      converted_amount: convertedAmount,
      category,
      date,
      merchant: merchant.trim() || null,
      source: "manual" as TransactionSource,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="glass-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-400" />
            Manual Entry
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="input-label">Description</label>
            <input
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lunch at Chipotle"
              autoFocus
            />
            {errors.description && <p className="text-xs text-danger-400 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Amount</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-xs text-danger-400 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="input-label">Currency</label>
              <select
                className="input-field"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {MOCK_RATES.map((r) => (
                  <option key={r.code} value={r.code}>{r.code} ({r.symbol})</option>
                ))}
              </select>
            </div>
          </div>

          {currency !== "USD" && parseFloat(amount) > 0 && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg px-3 py-2 text-sm text-primary-300">
              {currency} {parseFloat(amount).toFixed(2)} = USD {convertedAmount.toFixed(2)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Category</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  className="input-field pl-9"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="input-label">Date</label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Merchant (optional)</label>
            <input
              className="input-field"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Chipotle"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1">Save Transaction</button>
        </div>
      </div>
    </div>
  );
}
