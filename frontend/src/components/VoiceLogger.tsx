import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, AudioLines } from "lucide-react";

interface VoiceLoggerProps {
  onTranscript: (transcript: string) => void;
}

// Web Speech API types
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: { 0: SpeechRecognitionResult; isFinal: boolean } };
}
interface SpeechRecognitionInstance {
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
}

export default function VoiceLogger({ onTranscript }: VoiceLoggerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fallbackMode, setFallbackMode] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFallbackMode(true);
    }
  }, []);

  const startRecording = async () => {
    setTranscript("");
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (SpeechRecognition && !fallbackMode) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          onTranscript(finalTranscript);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } else {
      // Fallback: MediaRecorder
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          setIsProcessing(true);
          // In production, send audio to backend for transcription
          // For now, simulate with a demo transcript
          setTimeout(() => {
            const demoTranscripts = [
              "Spent fourteen dollars and fifty cents on lunch at Chipotle",
              "Paid six twenty five for coffee at Starbucks",
              "Fifty two dollars for gas at Shell",
            ];
            const demo = demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];
            setTranscript(demo);
            onTranscript(demo);
            setIsProcessing(false);
          }, 1200);
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch {
        // If mic access denied, use fallback text input
        setFallbackMode(true);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    } else if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
          isRecording
            ? "bg-danger-500 text-white scale-110 pulse-ring"
            : "bg-primary-600 text-white hover:bg-primary-500 hover:scale-105 animate-glow-pulse"
        }`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? (
          <Loader2 className="w-7 h-7 animate-spin" />
        ) : isRecording ? (
          <Square className="w-7 h-7" />
        ) : (
          <Mic className="w-7 h-7" />
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-slate-400">
          {isProcessing
            ? "Processing audio..."
            : isRecording
            ? "Listening... Tap to stop"
            : "Tap to speak your expense"}
        </p>

        {fallbackMode && (
          <p className="text-xs text-slate-500 mt-1">
            Voice recognition unavailable — using fallback mode
          </p>
        )}

        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <AudioLines className="w-4 h-4 text-danger-400 animate-pulse" />
            <span className="text-xs text-danger-400 font-medium">Recording</span>
          </div>
        )}

        {transcript && !isRecording && !isProcessing && (
          <div className="mt-3 glass-card px-4 py-3 max-w-md text-sm text-slate-200 animate-slide-up">
            "{transcript}"
          </div>
        )}
      </div>
    </div>
  );
}
