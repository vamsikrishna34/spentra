import { useState, useRef, useCallback } from "react";
import { Upload, X, FileImage, Loader2, CheckCircle2, Sparkles, ScanLine } from "lucide-react";
import { CATEGORIES } from "../services/mockData";

interface OcrModalProps {
  onClose: () => void;
  onParsed: (data: Omit<import("../types").Transaction, "id" | "user_id">) => void;
}

interface ParsedPreview {
  description: string;
  amount: number;
  currency: string;
  category: string;
  merchant: string | null;
  date: string;
  source: "ocr";
}

// Simulated OCR extraction — in production this would call the backend AI parser
const MOCK_RECEIPT_DATA: ParsedPreview[] = [
  {
    description: "Whole Foods Market — Grocery",
    amount: 87.42,
    currency: "USD",
    category: "food",
    merchant: "Whole Foods",
    date: new Date().toISOString().split("T")[0],
    source: "ocr",
  },
  {
    description: "Shell Gas Station — Fuel",
    amount: 58.30,
    currency: "USD",
    category: "transport",
    merchant: "Shell",
    date: new Date().toISOString().split("T")[0],
    source: "ocr",
  },
  {
    description: "CVS Pharmacy — Health & Beauty",
    amount: 34.15,
    currency: "USD",
    category: "health",
    merchant: "CVS",
    date: new Date().toISOString().split("T")[0],
    source: "ocr",
  },
];

export default function OcrModal({ onClose, onParsed }: OcrModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [parsed, setParsed] = useState<ParsedPreview | null>(null);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setParsed(null);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleScan = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 1800));
    const mockIdx = Math.floor(Math.random() * MOCK_RECEIPT_DATA.length);
    setParsed({ ...MOCK_RECEIPT_DATA[mockIdx] });
    setScanning(false);
  };

  const handleConfirm = () => {
    if (parsed) {
      onParsed(parsed);
      onClose();
    }
  };

  const handleEditField = (field: keyof ParsedPreview, value: string | number | null) => {
    if (!parsed) return;
    setParsed({ ...parsed, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="glass-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary-400" />
            OCR Receipt Scanner
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!fileName && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? "border-primary-500 bg-primary-500/10"
                : "border-surface-400/50 hover:border-primary-500/40 hover:bg-surface-200/30"
            }`}
          >
            <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-medium">Drop a receipt image here</p>
            <p className="text-xs text-slate-500 mt-1">or click to browse — PNG, JPG, WEBP</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {fileName && !parsed && !scanning && (
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-surface-300/50">
                <img src={previewUrl} alt="Receipt preview" className="w-full max-h-64 object-contain bg-surface-200/30" />
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <FileImage className="w-4 h-4 text-primary-400" />
              <span className="truncate">{fileName}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setFileName(null); setPreviewUrl(null); }}
                className="btn-secondary flex-1"
              >
                Remove
              </button>
              <button onClick={handleScan} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Scan Receipt
              </button>
            </div>
          </div>
        )}

        {scanning && (
          <div className="py-12 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-xl border-2 border-primary-500/30" />
              <div className="absolute inset-x-0 h-0.5 bg-primary-400 animate-pulse" style={{ top: "50%", boxShadow: "0 0 20px rgba(16,185,129,0.6)" }} />
              <ScanLine className="w-8 h-8 text-primary-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI is reading your receipt...
            </div>
          </div>
        )}

        {parsed && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center gap-2 text-primary-400 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Receipt scanned successfully
            </div>

            {previewUrl && (
              <div className="rounded-xl overflow-hidden border border-surface-300/50 mb-3">
                <img src={previewUrl} alt="Receipt" className="w-full max-h-40 object-contain bg-surface-200/30" />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="input-label">Description</label>
                {editing ? (
                  <input
                    className="input-field"
                    value={parsed.description}
                    onChange={(e) => handleEditField("description", e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-slate-200">{parsed.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Amount</label>
                  {editing ? (
                    <input
                      type="number"
                      className="input-field"
                      value={parsed.amount}
                      onChange={(e) => handleEditField("amount", parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <p className="text-sm text-slate-200 font-semibold">${parsed.amount.toFixed(2)} {parsed.currency}</p>
                  )}
                </div>
                <div>
                  <label className="input-label">Category</label>
                  {editing ? (
                    <select
                      className="input-field"
                      value={parsed.category}
                      onChange={(e) => handleEditField("category", e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-slate-200 capitalize">{parsed.category}</p>
                  )}
                </div>
              </div>

              {parsed.merchant && (
                <div>
                  <label className="input-label">Merchant</label>
                  <p className="text-sm text-slate-200">{parsed.merchant}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(!editing)} className="btn-secondary flex-1">
                {editing ? "Done Editing" : "Edit Details"}
              </button>
              <button onClick={handleConfirm} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
