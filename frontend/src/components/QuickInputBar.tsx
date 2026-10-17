import { Send, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

interface QuickInputBarProps {
  onSubmit: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
  compact?: boolean;
}

const EXAMPLES = [
  "Spent $14.50 on lunch at Chipotle",
  "Paid €42 for dinner in Paris",
  "£15.50 for train ticket in London",
  "₹500 for groceries",
];

export default function QuickInputBar({ onSubmit, loading, placeholder, compact }: QuickInputBarProps) {
  const [text, setText] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className={`flex gap-2 ${compact ? "" : ""}`}>
        <div className="relative flex-1">
          <Sparkles className="w-4 h-4 text-primary-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setShowExamples(true)}
            onBlur={() => setTimeout(() => setShowExamples(false), 200)}
            placeholder={placeholder || "e.g. Spent $45 on groceries at Whole Foods"}
            className="input-field pl-10"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {!compact && "Log"}
        </button>
      </form>

      {showExamples && !text && (
        <div className="space-y-1 animate-fade-in">
          <p className="text-xs text-slate-500 px-1">Try:</p>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setText(ex); setShowExamples(false); }}
              className="block w-full text-left text-xs text-slate-400 hover:text-primary-300
                         px-3 py-1.5 rounded-lg hover:bg-surface-200/40 transition-all duration-150"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
