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
      setIsConnected(false);
      setIsCallActive(false);
      setIsSpeaking(false);
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
        handleFunctionCallResult(msg);
      }
    });

    vapi.on("error", (err: any) => {
      setError(err?.message || "Bağlantı hatası oluştu");
    });

    return () => {
      vapi.stop();
    };
  }, [publicKey]);

  const handleFunctionCallResult = useCallback((msg: any) => {
    const { functionCall } = msg;
    if (!functionCall?.result) return;

    const result = functionCall.result;

    if (functionCall.name === "save_preferences") {
      if (result.interviewId) setInterviewId(result.interviewId);
      if (result.firstQuestion) setCurrentQuestion(result.firstQuestion);
    }

    if (functionCall.name === "get_next_question") {
      if (result.question) setCurrentQuestion(result.question);
      if (result.finished) setCurrentQuestion("");
    }

    if (functionCall.name === "end_interview") {
      if (result.overallScore) setOverallScore(result.overallScore);
    }
  }, []);

  const startCall = useCallback(() => {
    if (!vapiRef.current || !config) return;

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (assistantId) {
      vapiRef.current.start(assistantId, {
        variableValues: {
          field: config.field,
          techStack: config.techStack.join(", "),
          difficulty: config.difficulty,
        },
      });
    } else {
      // Inline assistant config for when no assistant ID is set
      vapiRef.current.start({
        name: "AI Mülakat Asistanı",
        model: {
          provider: "google" as any,
          model: "gemini-2.0-flash" as any,
          messages: [
            {
              role: "system" as any,
              content: `Sen Türkçe konuşan bir teknik mülakat yapay zeka asistanısın.

KURALLAR:
1. SADECE Türkçe konuş
2. Her soru sorduktan sonra MUTLAKA kullanıcının cevabını bekle
3. Kullanıcı cevap vermeden bir sonraki soruya geçme
4. Kibarlığını koru, cesaretlendirici ol
5. Her cevaptan sonra kısa bir yorum yap, sonra sıradaki soruya geç

MÜLAKAT BİLGİLERİ:
Alan: ${config.field}
Teknolojiler: ${config.techStack.join(", ")}
Seviye: ${config.difficulty}

İlk olarak kendinizi tanıtın ve mülakata başlayacağınızı söyleyin. Sonra ilk soruyu sorun ve cevabı bekleyin.
Toplamda 5 soru sorun. Son sorudan sonra mülakatı sonlandırın ve genel bir değerlendirme yapın.`,
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
                    interviewId: { type: "string" },
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
                description: "Mülakatı sonlandır ve değerlendir",
                parameters: {
                  type: "object",
                  properties: {
                    interviewId: { type: "string" },
                    answers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          answer: { type: "string" },
                          order: { type: "number" },
                        },
                      },
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
    }
  }, [config]);

  const endCall = useCallback(() => {
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
