"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";

interface UseVapiConfig {
  field: string;
  techStack: string[];
  difficulty: string;
}

interface TranscriptEntry {
  role: "assistant" | "user";
  text: string;
  timestamp: Date;
}

interface UseVapiReturn {
  isConnected: boolean;
  isCallActive: boolean;
  isSpeaking: boolean;
  transcript: TranscriptEntry[];
  currentQuestion: string;
  interviewId: string | null;
  overallScore: number | null;
  error: string | null;
  volumeLevel: number;
  startCall: () => void;
  endCall: () => void;
}

export function useVapi(config: UseVapiConfig | null): UseVapiReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  // Track whether call was manually ended by user (vs connection drop)
  const manualEndRef = useRef(false);

  const vapiRef = useRef<Vapi | null>(null);
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey) {
      setError("VAPI key not configured");
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setIsConnected(true);
      setIsCallActive(true);
      setError(null);
    });

    vapi.on("call-end", () => {
      setIsCallActive(false);
      setIsSpeaking(false);
      // Keep isConnected true so UI doesn't show "Bağlanıyor..."
      // If user manually ended, transition to completed
      if (manualEndRef.current) {
        manualEndRef.current = false;
        // Set a default score so the page transitions to completed
        setOverallScore((prev) => (prev !== null ? prev : 0));
      }
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    vapi.on("volume-level", (level: number) => {
      setVolumeLevel(level);
    });

    vapi.on("message", (msg: any) => {
      if (msg.type === "transcript") {
        if (msg.transcriptType === "final") {
          setTranscript((prev) => [
            ...prev,
            {
              role: msg.role,
              text: msg.transcript,
              timestamp: new Date(),
            },
          ]);
        }
      }

      if (msg.type === "function-call") {
        handleFunctionCall(msg);
      }
    });

    vapi.on("error", (err: any) => {
      console.error("VAPI error:", err);
      setError(err?.message || "Bağlantı hatası oluştu");
    });

    return () => {
      vapi.stop();
    };
  }, [publicKey]);

  const handleFunctionCall = useCallback((msg: any) => {
    const { functionCall } = msg;
    if (!functionCall) return;

    const result = functionCall.result || {};

    if (functionCall.name === "save_preferences") {
      if (result.interviewId) setInterviewId(result.interviewId);
      if (result.firstQuestion) setCurrentQuestion(result.firstQuestion);
    }

    if (functionCall.name === "get_next_question") {
      if (result.question) setCurrentQuestion(result.question);
      if (result.finished) setCurrentQuestion("");
    }

    if (functionCall.name === "end_interview") {
      const score = result.overallScore ?? result.score ?? result.overall_score;
      if (score != null) {
        setOverallScore(score);
      } else {
        // AI called end_interview but didn't provide score — use 0 to trigger transition
        setOverallScore(0);
      }
    }
  }, []);

  const startCall = useCallback(() => {
    if (!vapiRef.current || !config) return;

    // Always use inline assistant config to ensure Turkish language settings
    // Do NOT use NEXT_PUBLIC_VAPI_ASSISTANT_ID — that uses dashboard config which may be English
    vapiRef.current.start({
      name: "AI Mülakat Asistanı",
      transcriber: {
        provider: "deepgram" as any,
        model: "nova-2" as any,
        language: "tr" as any,
      },
      model: {
        provider: "google" as any,
        model: "gemini-2.0-flash" as any,
        messages: [
          {
            role: "system" as any,
            content: `Sen Türkçe konuşan bir teknik mülakat yapay zeka asistanısın.

KURALLAR:
1. SADECE ve YALNIZCA Türkçe konuş. Asla İngilizce konuşma.
2. Her soru sorduktan sonra MUTLAKA kullanıcının cevabını bekle
3. Kullanıcı cevap vermeden bir sonraki soruya geçme
4. Kibarlığını koru, cesaretlendirici ol
5. Her cevaptan sonra kısa bir yorum yap, sonra sıradaki soruya geç
6. Kullanıcı "mülakatı bitir" veya "bitir" dediğinde hemen end_interview fonksiyonunu çağır

MÜLAKAT BİLGİLERİ:
Alan: ${config.field}
Teknolojiler: ${config.techStack.join(", ")}
Seviye: ${config.difficulty}

İlk olarak kendinizi tanıtın ve mülakata başlayacağınızı söyleyin. Sonra ilk soruyu sorun ve cevabı bekleyin.
Toplamda 5 soru sorun. Son sorudan sonra end_interview fonksiyonunu çağırarak mülakatı sonlandırın.`,
          },
        ],
        tools: [
          {
            type: "function" as any,
            function: {
              name: "save_preferences",
              description: "Mülakat başlamadan tercihleri kaydet",
              parameters: {
                type: "object",
                properties: {
                  field: { type: "string", description: "Mülakat alanı" },
                  techStack: {
                    type: "array",
                    items: { type: "string" },
                    description: "Teknolojiler",
                  },
                  difficulty: {
                    type: "string",
                    description: "Zorluk seviyesi",
                  },
                },
                required: ["field"],
              },
            },
          },
          {
            type: "function" as any,
            function: {
              name: "save_answer",
              description: "Kullanıcı cevabını kaydet",
              parameters: {
                type: "object",
                properties: {
                  questionOrder: { type: "number" },
                  questionText: { type: "string" },
                  answer: { type: "string" },
                },
                required: ["questionOrder", "answer"],
              },
            },
          },
          {
            type: "function" as any,
            function: {
              name: "end_interview",
              description:
                "Mülakatı sonlandır. Kullanıcı bitirmek istediğinde veya tüm sorular bittığında çağır.",
              parameters: {
                type: "object",
                properties: {
                  overallScore: {
                    type: "number",
                    description: "Genel performans puanı 0-100 arası",
                  },
                  summary: {
                    type: "string",
                    description: "Kısa değerlendirme özeti",
                  },
                },
              },
            },
          },
        ],
      },
      voice: {
        provider: "11labs" as any,
        voiceId: "TX3LPaxmHKxFdv7VOQHJ" as any,
      },
      firstMessage: `Merhaba! Ben yapay zeka mülakat asistanınızım. ${config.field} alanında, ${config.techStack.join(", ")} teknolojileri hakkında ${config.difficulty} seviyesinde bir mülakat gerçekleştireceğiz. Hazır olduğunuzda başlayabiliriz. İlk sorumla başlıyorum.`,
    } as any);
  }, [config]);

  const endCall = useCallback(() => {
    // Mark that user manually ended the call
    manualEndRef.current = true;
    vapiRef.current?.stop();
  }, []);

  return {
    isConnected,
    isCallActive,
    isSpeaking,
    transcript,
    currentQuestion,
    interviewId,
    overallScore,
    error,
    volumeLevel,
    startCall,
    endCall,
  };
}
