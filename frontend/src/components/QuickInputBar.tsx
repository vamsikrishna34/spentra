import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface QuickInputBarProps {
  onSubmit: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function QuickInputBar({ onSubmit, loading, placeholder }: QuickInputBarProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || "e.g. Spent $12.50 on coffee at Starbucks"}
        className="input-field flex-1"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 />}
        Log
      </button>
    </form>
  );
}
