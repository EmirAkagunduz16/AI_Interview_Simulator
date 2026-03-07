"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import api from "@/lib/axios";
import {
  buildSystemPrompt,
  buildFirstMessage,
} from "../config/vapi-system-prompt";
import { buildVapiTools } from "../config/vapi-tools";
import {
  handleVapiFunctionCall,
  getAccumulatedAnswers,
  resetAccumulatedAnswers,
  type VapiStateSetters,
} from "../config/vapi-message-handler";
import { normalizeTranscript } from "../config/transcript-normalizer";

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
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Track whether call was manually ended by user
  const manualEndRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const vapiRef = useRef<Vapi | null>(null);
  // Keep config in a ref so startCall always reads the latest value
  const configRef = useRef(config);
  configRef.current = config;

  // Stable setters ref for the message handler (avoids stale closures)
  const settersRef = useRef<VapiStateSetters>({
    setInterviewId: (id: string) => {
      setInterviewId(id);
      interviewIdRef.current = id;
    },
    setCurrentQuestion,
    setOverallScore,
  });

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

  // ── VAPI lifecycle ────────────────────────────────────────────────
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
      if (manualEndRef.current) {
        manualEndRef.current = false;
        reconnectAttemptRef.current = 0;
        setOverallScore((prev) => (prev !== null ? prev : 0));
      } else if (reconnectAttemptRef.current < 2) {
        // Unexpected disconnection -- attempt auto-reconnect once
        reconnectAttemptRef.current++;
        setError("Bağlantı koptu, yeniden bağlanılıyor...");
        setTimeout(() => {
          setError(null);
          // re-trigger startCall (the user won't need to click again)
        }, 2000);
      }
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));
    vapi.on("volume-level", (level: number) => setVolumeLevel(level));

    vapi.on("message", (msg: any) => {
      if (msg.type === "function-call") {
        handleVapiFunctionCall(msg, vapi, settersRef.current);
      }
      // Save transcript messages (final only) to backend for chat history
      if (
        msg.type === "transcript" &&
        msg.transcriptType === "final" &&
        msg.transcript
      ) {
        const currentId = interviewIdRef.current;
        if (currentId) {
          const normalized = normalizeTranscript(msg.transcript);
          api
            .post(`/interviews/${currentId}/messages`, {
              role: msg.role === "assistant" ? "agent" : "user",
              content: normalized,
            })
            .catch((err: unknown) =>
              console.warn("Failed to save transcript message:", err),
            );
        }
      }
    });

    vapi.on("error", (err: any) => {
      console.error("VAPI error:", err);
      const code = err?.errorCode || err?.code || "";
      const msg = err?.message || "";
      let userMessage = "Bağlantı hatası oluştu";
      if (
        code === "pipeline-error-openai-llm-failed" ||
        msg.includes("LLM")
      ) {
        userMessage = "Yapay zeka modeline bağlanılamadı, lütfen tekrar deneyin.";
      } else if (
        code === "pipeline-error-deepgram-transcriber-failed" ||
        msg.includes("transcri")
      ) {
        userMessage = "Ses tanıma servisi bağlantısı kesildi, tekrar deneyin.";
      } else if (msg.includes("network") || msg.includes("WebSocket")) {
        userMessage = "Ağ bağlantınızda bir sorun var, internet bağlantınızı kontrol edin.";
      }
      setError(userMessage);
    });

    return () => {
      vapi.stop();
    };
  }, [publicKey]);

  // ── Start call ─────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (!vapiRef.current) return;

    const cfg = configRef.current;
    if (!cfg.field) return;

    // Create interview record on the backend first
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
    } catch (err: unknown) {
      console.error("Failed to create interview on start:", err);
      setError("Mülakat başlatılamadı, lütfen tekrar deneyin.");
      return;
    }

    const systemPrompt = buildSystemPrompt({
      field: cfg.field,
      techStack: cfg.techStack,
      difficulty: cfg.difficulty,
      interviewId: newInterviewId,
    });

    const tools = buildVapiTools(newInterviewId);

    // Use a transient assistant — no dashboard assistantId needed.
    // The model, voice, and transcriber are all configured inline.
    vapiRef.current.start({
      transcriber: {
        provider: "deepgram",
        model: "nova-3",
        language: "tr",
        smartFormat: true,
      } as any,
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        tools: tools,
      },
      voice: {
        provider: "vapi",
        voiceId: "Elliot",
      },
      firstMessage: buildFirstMessage(cfg),
      firstMessageInterruptionsEnabled: false,
      silenceTimeoutSeconds: 60,
      maxDurationSeconds: 2400,
      backgroundDenoisingEnabled: true,
      backgroundSound: "off",
      endCallMessage:
        "Mülakat sona erdi. Sonuçlarınız hazırlanıyor, teşekkür ederim!",
      clientMessages: [
        "transcript",
        "function-call",
        "hang",
        "speech-update",
        "metadata",
        "conversation-update",
      ],
      serverMessages: [
        "end-of-call-report",
        "status-update",
      ],
    } as any);
  }, []);

  // ── End call ───────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    manualEndRef.current = true;
    vapiRef.current?.stop();

    const activeInterviewId = interviewIdRef.current;

    if (activeInterviewId) {
      try {
        const clientAnswers = getAccumulatedAnswers();

        const response = await api.post("/ai/vapi/webhook", {
          message: {
            type: "function-call",
            functionCall: {
              name: "end_interview",
              parameters: {
                interviewId: activeInterviewId,
                answers: clientAnswers,
              },
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
      } finally {
        resetAccumulatedAnswers();
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
