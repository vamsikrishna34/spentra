import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  Loader2,
  Bot,
} from "lucide-react";
import type { Transaction, Budget } from "../types";
import { dataStore } from "../services/dataStore";

interface AiSidebarChatProps {
  transactions: Transaction[];
  budgets: Budget[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  "How am I doing on food?",
  "Where can I save money?",
  "Am I over budget?",
  "Transport spending?",
];

export default function AiSidebarChat({ transactions, budgets }: AiSidebarChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-init",
      role: "assistant",
      content: "Hi! I'm your AI financial coach. Ask me about your spending, budgets, or saving tips.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content?: string) => {
    const msgText = (content || input).trim();
    if (!msgText || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: msgText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await dataStore.getCoachResponse(msgText, transactions, budgets);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: response,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content: "I couldn't process that request. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full
          bg-primary-600 text-white shadow-lg shadow-primary-600/30
          hover:bg-primary-500 transition-all duration-300
          flex items-center justify-center hover:scale-110 z-40
          animate-glow-pulse
          ${isOpen ? "opacity-0 pointer-events-none scale-50" : "opacity-100"}`}
        aria-label="Open AI chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-400 rounded-full animate-pulse" />
      </button>

      {/* Chat panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-full sm:w-96
          bg-surface-50/95 backdrop-blur-xl shadow-2xl
          border-l border-surface-200/60
          flex flex-col z-50 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-200/60 flex items-center justify-between bg-primary-600/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <span className="font-semibold text-white text-sm">AI Financial Coach</span>
              <p className="text-xs text-primary-400/70">Online</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="btn-ghost p-1.5"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary-400" />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary-600 text-white rounded-br-md"
                    : "bg-surface-200/60 text-slate-200 rounded-bl-md border border-surface-300/30"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary-400" />
              </div>
              <div className="bg-surface-200/60 rounded-2xl rounded-bl-md px-4 py-3 border border-surface-300/30">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick prompts */}
          {messages.length <= 1 && !loading && (
            <div className="pt-2 space-y-1.5">
              <p className="text-xs text-slate-500 px-1">Quick questions:</p>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="block w-full text-left text-xs text-slate-400 hover:text-primary-300
                             px-3 py-2 rounded-lg bg-surface-200/30 hover:bg-surface-200/60
                             border border-surface-300/30 transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-surface-200/60">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your spending..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary p-2.5 disabled:opacity-40"
              aria-label="Send message"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
