"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";

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
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        setOverallScore(0);
      }
    }
  }, []);

  const startCall = useCallback(() => {
    if (!vapiRef.current) return;

    // Always read latest config from ref (avoids stale closure)
    const cfg = configRef.current;
    if (!cfg.field) return;

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      setError("VAPI Assistant ID yapılandırılmamış");
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
4. firstMessage zaten mülakatı tanıttı, sen doğrudan ilk soruyu sor. Kendini tekrar tanıtma, mülakatı tekrar açıklama.

SORU GEÇİŞ TARZI:
- Kullanıcı cevap verdikten sonra, önce kısa ve yapıcı bir yorum yap (1 cümle). Örnek: "Güzel bir yaklaşım, özellikle X kısmını iyi açıkladınız."
- Sonra doğal bir geçiş cümlesi kullan. Örnekler:
  * "Peki, şimdi şunu sormak istiyorum..."
  * "Tamamdır, bir sonraki konumuza geçelim."
  * "Anladım, peki şu konuda ne düşünüyorsunuz..."
  * "İlginç bir bakış açısı. Şimdi farklı bir konuya geçiyorum."
- ASLA "Harika, ilk soruyla mülakata başlayalım" gibi tekrarlayan kalıplar kullanma.
- Her geçişte farklı bir ifade kullan, monoton olma.

MÜLAKAT BİLGİLERİ:
Alan: ${cfg.field}
Teknolojiler: ${cfg.techStack.join(", ")}
Seviye: ${cfg.difficulty}

AKIŞ:
1. Doğrudan ilk teknik soruyu sor (firstMessage zaten tanıtımı yaptı).
2. Cevabı dinle, kısa yorum yap, sonraki soruya geç.
3. Toplamda 5 soru sor.
4. Son sorudan sonra kısa bir genel değerlendirme yap ve end_interview fonksiyonunu çağır.
5. Kullanıcı "mülakatı bitir" veya "bitir" derse hemen end_interview fonksiyonunu çağır.`,
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
                },
              },
            },
          },
        ],
      } as any,
      firstMessage: `Merhaba! Ben AI Mülakat Koçunuzum. ${cfg.field} alanında, ${cfg.techStack.join(", ")} teknolojileri hakkında ${cfg.difficulty} seviyesinde bir mülakat gerçekleştireceğiz. Hazırsanız hemen başlıyorum.`,
    } as any);
  }, []);

  const endCall = useCallback(() => {
    // Mark that user manually ended the call
    manualEndRef.current = true;
    vapiRef.current?.stop();
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
