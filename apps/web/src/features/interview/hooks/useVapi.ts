"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import api from "@/lib/axios";

export interface UseVapiConfig {
  field: string;
  techStack: string[];
  difficulty: string;
}

interface UseVapiReturn {
  isConnected: boolean;
  isCallActive: boolean;
  isSpeaking: boolean;
  currentQuestion: string;
  interviewId: string | null;
  overallScore: number | null;
  error: string | null;
  volumeLevel: number;
  startCall: () => void;
  endCall: () => void;
}

export function useVapi(config: UseVapiConfig): UseVapiReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const interviewIdRef = useRef<string | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  // Track whether call was manually ended by user (vs connection drop)
  const manualEndRef = useRef(false);

  const vapiRef = useRef<Vapi | null>(null);
  // Keep config in a ref so startCall always reads the latest value
  const configRef = useRef(config);
  configRef.current = config;

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
      // If user manually ended, transition to completed
      if (manualEndRef.current) {
        manualEndRef.current = false;
        setOverallScore((prev) => (prev !== null ? prev : 0));
      }
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    vapi.on("volume-level", (level: number) => {
      setVolumeLevel(level);
    });

    vapi.on("message", (msg: any) => {
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

  const handleFunctionCall = useCallback(
    async (msg: any) => {
      const { functionCall } = msg;
      if (!functionCall) return;

      try {
        // 1. Forward to backend webhook
        const response = await api.post("/ai/vapi/webhook", { message: msg });

        const data = response.data;
        const result = data.result || {};

        // 2. Update local state based on function name
        if (functionCall.name === "save_preferences") {
          if (result.interviewId) {
            setInterviewId(result.interviewId);
            interviewIdRef.current = result.interviewId;
          }
          if (result.firstQuestion) setCurrentQuestion(result.firstQuestion);
          if (result.questions) setAllQuestions(result.questions);
        }

        // Logic for save_answer to inject next question
        if (functionCall.name === "save_answer") {
          const currentOrder = functionCall.parameters.questionOrder;
          const nextQ = allQuestions.find((q) => q.order === currentOrder + 1);

          if (nextQ) {
            result.nextQuestion = nextQ.question;
            result.progress = `Question ${nextQ.order} of ${allQuestions.length}`;
            setCurrentQuestion(nextQ.question);
          } else {
            result.finished = true;
            result.message = "Tüm sorular tamamlandı. Mülakatı bitirebilirsin.";
            setCurrentQuestion("");
          }
        }

        if (functionCall.name === "get_next_question") {
          if (result.question) setCurrentQuestion(result.question);
          if (result.finished) setCurrentQuestion("");
        }

        if (functionCall.name === "end_interview") {
          const score =
            result.overallScore ?? result.score ?? result.overall_score;
          if (score != null) {
            setOverallScore(score);
          } else {
            setOverallScore(0);
          }
        }

        // 3. Send result back to Vapi
        if (vapiRef.current) {
          vapiRef.current.send({
            type: "add-message",
            message: {
              role: "tool",
              toolCallId: functionCall.toolCallId || msg.toolCallId,
              name: functionCall.name,
              content:
                typeof result === "string" ? result : JSON.stringify(result),
            },
          });
        }
      } catch (err) {
        console.error("Error handling function call:", err);
      }
    },
    [allQuestions],
  );

  const startCall = useCallback(async () => {
    if (!vapiRef.current) return;

    // Always read latest config from ref (avoids stale closure)
    const cfg = configRef.current;
    if (!cfg.field) return;

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      setError("VAPI Assistant ID yapılandırılmamış");
      return;
    }

    // CREATE INTERVIEW FIRST
    let newInterviewId: string;
    try {
      const res = await api.post("/interviews", {
        field: cfg.field,
        techStack: cfg.techStack,
        difficulty: cfg.difficulty,
        title: `${cfg.field} Developer Interview`,
        questionCount: 5,
        type: "technical",
        targetRole: cfg.field,
        durationMinutes: 30,
      });
      newInterviewId = res.data.id;
      setInterviewId(newInterviewId);
      interviewIdRef.current = newInterviewId;
    } catch (err: any) {
      console.error("Failed to create interview on start:", err);
      setError("Mülakat başlatılamadı, lütfen tekrar deneyin.");
      return;
    }

    // Use the dashboard assistant (model, voice, transcriber come from Vapi dashboard)
    // Only override: system prompt, tools, and firstMessage
    vapiRef.current.start(assistantId, {
      model: {
        provider: "google" as any,
        model: "gemini-2.0-flash" as any,
        messages: [
          {
            role: "system" as any,
            content: `Sen Türkçe konuşan profesyonel bir teknik mülakat yapay zeka asistanısın. Adın "AI Mülakat Koçu".

ÖNEMLİ KURALLAR:
1. SADECE ve YALNIZCA Türkçe konuş. Asla İngilizce kelime veya cümle kullanma.
2. Her soruyu sorduktan sonra MUTLAKA kullanıcının cevabını bekle. Cevap gelmeden KESİNLİKLE yeni soru sorma.
3. Kendin tekrar etme. "İlk soruyla başlayalım" veya "mülakata başlayalım" gibi ifadeleri SADECE BİR KERE söyle, sonra bir daha tekrarlama.
4. firstMessage zaten mülakatı tanıttı. Artık kendini tanıtma.

SORU GEÇİŞ ALGORİTMASI (ÇOK ÖNEMLİ):
- Kullanıcı cevabını aldıktan sonra "save_answer" fonksiyonunu çağır.
- Bu fonksiyon sana "nextQuestion" (sonraki soru) dönecek.
- Bir sonraki adımda KESİNLİKLE ve SADECE bu "nextQuestion"ı sor.
- Kendi kafandan soru uydurma, listedeki sırayı takip et.
- Eğer fonksiyon "finished": true dönerse, mülakatı bitiriyorum de ve "end_interview" çağır.

SORU GEÇİŞ TARZI:
- Kullanıcı cevap verdikten sonra, önce kısa ve yapıcı bir yorum yap (1 cümle). Örnek: "Güzel bir yaklaşım, özellikle X kısmını iyi açıkladınız."
- Sonra "save_answer" aracından gelen "nextQuestion"ı sor.

MÜLAKAT BİLGİLERİ:
Alan: ${cfg.field}
Teknolojiler: ${cfg.techStack.join(", ")}
Seviye: ${cfg.difficulty}
Interview ID: ${newInterviewId}

AKIŞ:
1. Kullanıcıdan onay aldığın anda KESİNLİKLE İLK İŞ "save_preferences" fonksiyonunu çağır (tercihlere ek olarak "interviewId": "${newInterviewId}" ekle). Bu fonksiyon sana mülakat sorularını oluşturacak ve ilk soruyu (firstQuestion) döndürecektir.
2. Sorular hazırlandıktan sonra, sadece sana dönen bu ilk soruyu sorarak mülakata başla.
3. Cevabı al -> save_answer çağır -> gelen nextQuestion'ı sor.
4. Toplamda 5 soru sor.
5. Son sorudan sonra end_interview çağır.`,
          },
        ],
        // ... (rest of tools)

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
                  interviewId: {
                    type: "string",
                    description:
                      "Mülakat ID'si. Değer her zaman: " + newInterviewId,
                  },
                },
                required: ["field", "interviewId"],
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
                  interviewId: {
                    type: "string",
                    description: "Mülakat ID'si. Her zaman: " + newInterviewId,
                  },
                },
                required: ["questionOrder", "answer", "interviewId"],
              },
            },
          },
          {
            type: "function" as any,
            function: {
              name: "end_interview",
              description:
                "Mülakatı sonlandır. Kullanıcı bitirmek istediğinde veya tüm sorular bittiğinde çağır.",
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
                  interviewId: {
                    type: "string",
                    description: "Mülakat ID'si. Her zaman: " + newInterviewId,
                  },
                },
                required: ["interviewId"],
              },
            },
          },
        ],
      } as any,
      firstMessage: `Merhaba! Ben AI Mülakat Koçunuzum. ${cfg.field} alanında, ${cfg.techStack.join(", ")} teknolojileri hakkında ${cfg.difficulty} seviyesinde bir mülakat gerçekleştireceğiz. Hazırsanız hemen başlıyorum.`,
    } as any);
  }, []);

  const endCall = useCallback(async () => {
    // Mark that user manually ended the call
    manualEndRef.current = true;
    vapiRef.current?.stop();

    const activeInterviewId = interviewIdRef.current;

    if (activeInterviewId) {
      try {
        const response = await api.post("/ai/vapi/webhook", {
          message: {
            type: "function-call",
            functionCall: {
              name: "end_interview",
              parameters: { interviewId: activeInterviewId },
            },
          },
        });
        const data = response.data;
        const score = data.result?.overallScore ?? data.result?.score;
        if (score != null) {
          setOverallScore(score);
        } else {
          setOverallScore(0);
        }
      } catch (err) {
        console.error("Error gracefully ending interview:", err);
      }
    } else {
      setOverallScore(0);
    }
  }, []);

  return {
    isConnected,
    isCallActive,
    isSpeaking,
    currentQuestion,
    interviewId,
    overallScore,
    error,
    volumeLevel,
    startCall,
    endCall,
  };
}
