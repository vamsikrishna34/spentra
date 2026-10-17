import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

interface VoiceLoggerProps {
  onTranscript: (transcript: string) => void;
}

export default function VoiceLogger({ onTranscript }: VoiceLoggerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || ""}/api/transactions/voice`,
            {
              method: "POST",
              body: formData,
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data.transcript) {
              onTranscript(data.transcript);
            }
          }
        } catch (err) {
          console.error("Voice processing failed:", err);
        } finally {
          setIsProcessing(false);
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
          isRecording
            ? "bg-danger-500 text-white scale-110"
            : "bg-primary-600 text-white hover:bg-primary-700 hover:scale-105"
        } ${isRecording ? "pulse-ring" : ""}`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isRecording ? (
          <Square className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>

      <p className="text-sm text-slate-500">
        {isProcessing
          ? "Processing audio..."
          : isRecording
          ? "Listening... Tap to stop"
          : "Tap to speak your expense"}
      </p>
    </div>
  );
}
