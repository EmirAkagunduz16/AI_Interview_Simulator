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

  // Message buffer: accumulate transcripts of the same role and flush on
  // role change or 5+ second silence gap.
  const messageBufferRef = useRef<{
    role: string;
    chunks: string[];
    lastTimestamp: number;
  } | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushMessageBuffer = useCallback(() => {
    const buffer = messageBufferRef.current;
    const currentId = interviewIdRef.current;
    if (!buffer || buffer.chunks.length === 0 || !currentId) return;

    const content = buffer.chunks.join(" ");
    const role = buffer.role;

    messageBufferRef.current = null;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    api
      .post(`/interviews/${currentId}/messages`, { role, content })
      .catch((err: unknown) =>
        console.warn("Failed to save transcript message:", err),
      );
  }, []);

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
      flushMessageBuffer();
      setIsCallActive(false);
      setIsSpeaking(false);
      if (manualEndRef.current) {
        manualEndRef.current = false;
        reconnectAttemptRef.current = 0;
        setOverallScore((prev) => (prev !== null ? prev : 0));
      } else if (reconnectAttemptRef.current < 2) {
        reconnectAttemptRef.current++;
        setError("Bağlantı koptu, yeniden bağlanılıyor...");
        setTimeout(() => {
          setError(null);
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

      if (
        msg.type === "transcript" &&
        msg.transcriptType === "final" &&
        msg.transcript
      ) {
        const currentId = interviewIdRef.current;
        if (currentId) {
          const normalized = normalizeTranscript(msg.transcript);
          const role = msg.role === "assistant" ? "agent" : "user";
          const now = Date.now();
          const buffer = messageBufferRef.current;

          if (
            buffer &&
            (buffer.role !== role || now - buffer.lastTimestamp >= 5000)
          ) {
            flushMessageBuffer();
          }

          if (!messageBufferRef.current) {
            messageBufferRef.current = {
              role,
              chunks: [],
              lastTimestamp: now,
            };
          }
          messageBufferRef.current.chunks.push(normalized);
          messageBufferRef.current.lastTimestamp = now;

          if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
          }
          flushTimerRef.current = setTimeout(flushMessageBuffer, 5000);
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
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      vapi.stop();
    };
  }, [publicKey, flushMessageBuffer]);

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

    vapiRef.current.start({
      transcriber: {
        provider: "deepgram",
        model: "nova-3",
        language: "multi",
        keywords: [
          "NestJS:5",
          "Next.js:5",
          "Node.js:5",
          "React:5",
          "TypeScript:5",
          "JavaScript:5",
          "MongoDB:5",
          "PostgreSQL:5",
          "GraphQL:5",
          "Docker:5",
          "Kubernetes:5",
          "Express:5",
          "REST API:5",
          "middleware:3",
          "dependency injection:3",
          "microservice:3",
          "backend:3",
          "frontend:3",
          "component:3",
          "state management:3",
          "controller:3",
          "decorator:3",
          "provider:3",
          "module:3",
          "prisma:3",
          "webpack:3",
          "Redis:3",
          "CI/CD:3",
          "git:3",
          "AWS:3",
          "Azure:3",
        ],
        fallbackPlan: {
          transcribers: [
            {
              provider: "deepgram",
              model: "nova-3",
              language: "tr",
            },
          ],
        },
      } as any,
      model: {
        provider: "openai",
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        tools: tools,
      },
      voice: {
        provider: "11labs",
        voiceId: "dDcfsSsiSzmphdMGCECb",
        model: "eleven_turbo_v2_5",
        stability: 0.5,
        similarityBoost: 0.75,
        optimizeStreamingLatency: 3,
        fallbackPlan: {
          voices: [
            {
              model: "eleven_multilingual_v2",
              optimizeStreamingLatency: 3,
              useSpeakerBoost: false,
              similarityBoost: 0.75,
              stability: 0.5,
              voiceId: "dDcfsSsiSzmphdMGCECb",
              provider: "11labs",
            },
          ],
        },
      } as any,
      firstMessage: buildFirstMessage(cfg),
      firstMessageInterruptionsEnabled: false,
      silenceTimeoutSeconds: 90,
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
      serverMessages: ["end-of-call-report", "status-update"],
    } as any);
  }, []);

  // ── End call ───────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    flushMessageBuffer();
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
  }, [flushMessageBuffer]);

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
