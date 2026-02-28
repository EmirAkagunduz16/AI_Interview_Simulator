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
  type VapiStateSetters,
} from "../config/vapi-message-handler";

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
        setOverallScore((prev) => (prev !== null ? prev : 0));
      }
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));
    vapi.on("volume-level", (level: number) => setVolumeLevel(level));

    vapi.on("message", (msg: any) => {
      if (msg.type === "function-call") {
        handleVapiFunctionCall(msg, vapi, settersRef.current);
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
        model: "nova-2",
        language: "tr",
      },
      model: {
        provider: "google",
        model: "gemini-2.0-flash",
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
      silenceTimeoutSeconds: 120,
      maxDurationSeconds: 2400,
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
        "function-call",
        "transcript",
        "status-update",
        "speech-update",
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
