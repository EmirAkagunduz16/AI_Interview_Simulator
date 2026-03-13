"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import api from "@/lib/axios";
import { normalizeTranscript } from "../config/transcript-normalizer";
import { patchElevenLabsErrorHandler } from "../config/elevenlabs-patch";

patchElevenLabsErrorHandler();

export interface UseElevenLabsConfig {
  field: string;
  techStack: string[];
  difficulty: string;
}

export interface TranscriptMessage {
  id: string;
  source: "user" | "ai";
  message: string;
  timestamp: number;
}

export interface AccumulatedAnswer {
  question: string;
  answer: string;
  order: number;
  questionId?: string;
}

interface UseElevenLabsReturn {
  isConnected: boolean;
  isCallActive: boolean;
  isSpeaking: boolean;
  micMuted: boolean;
  toggleMic: () => void;
  agentStatus: "listening" | "thinking" | "speaking" | null;
  currentQuestion: string;
  interviewId: string | null;
  overallScore: number | null;
  error: string | null;
  transcript: TranscriptMessage[];
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  inputVolume: number;
  outputVolume: number;
}

const AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ||
  "agent_6701kkew695fem3ab07318ff6zzw";

export function useElevenLabs(config: UseElevenLabsConfig): UseElevenLabsReturn {
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentStatus, setAgentStatus] = useState<
    "listening" | "thinking" | "speaking" | null
  >(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const interviewIdRef = useRef<string | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);

  const configRef = useRef(config);
  configRef.current = config;
  const manualEndRef = useRef(false);
  const scoreSetRef = useRef(false);
  const accumulatedAnswers = useRef<AccumulatedAnswer[]>([]);

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

  const conversation = useConversation({
    onConnect: () => {
      setIsCallActive(true);
      setError(null);
    },
    onDisconnect: () => {
      flushMessageBuffer();
      setIsCallActive(false);
      setAgentStatus(null);

      if (!manualEndRef.current && !scoreSetRef.current) {
        const activeId = interviewIdRef.current;
        if (activeId) {
          api
            .post("/ai/vapi/webhook", {
              message: {
                type: "function-call",
                functionCall: {
                  name: "end_interview",
                  parameters: {
                    interviewId: activeId,
                    answers: accumulatedAnswers.current,
                  },
                },
              },
            })
            .then((res) => {
              const score =
                res.data.result?.overallScore ?? res.data.result?.score;
              setOverallScore(score != null ? score : 0);
            })
            .catch(() => setOverallScore(0))
            .finally(() => {
              accumulatedAnswers.current = [];
            });
        }
      }
      manualEndRef.current = false;
    },
    onMessage: (message: { message: string; source: "user" | "ai"; role?: string }) => {
      if (!message.message) return;

      const source = message.source === "ai" ? "ai" : "user";

      const msg: TranscriptMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source,
        message: message.message,
        timestamp: Date.now(),
      };

      setTranscript((prev) => [...prev, msg]);

      const currentId = interviewIdRef.current;
      if (currentId) {
        const normalized = normalizeTranscript(msg.message);
        const role = msg.source === "ai" ? "agent" : "user";
        const now = Date.now();
        const buffer = messageBufferRef.current;

        if (
          buffer &&
          (buffer.role !== role || now - buffer.lastTimestamp >= 5000)
        ) {
          flushMessageBuffer();
        }

        if (!messageBufferRef.current) {
          messageBufferRef.current = { role, chunks: [], lastTimestamp: now };
        }
        messageBufferRef.current.chunks.push(normalized);
        messageBufferRef.current.lastTimestamp = now;

        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(flushMessageBuffer, 5000);
      }
    },
    onError: (message: string, context?: Record<string, unknown>) => {
      console.error("ElevenLabs error:", message, context);

      if (message.includes("max_duration_exceeded")) {
        setError("Mülakat süresi doldu.");
      } else {
        setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      }
    },
    onModeChange: (prop: { mode: "speaking" | "listening" }) => {
      setAgentStatus(prop.mode);
    },
    onUnhandledClientToolCall: (params: { tool_name: string; tool_call_id: string; parameters: unknown }) => {
      console.warn("Unhandled client tool call:", params);
    },
    onDebug: (props: unknown) => {
      console.debug("[ElevenLabs debug]", props);
    },
  });

  // Poll volume levels during active call
  useEffect(() => {
    if (!isCallActive) {
      setInputVolume(0);
      setOutputVolume(0);
      return;
    }

    let raf: number;
    const poll = () => {
      setInputVolume(conversation.getInputVolume?.() ?? 0);
      setOutputVolume(conversation.getOutputVolume?.() ?? 0);
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);

    return () => cancelAnimationFrame(raf);
  }, [isCallActive, conversation]);

  const buildClientTools = useCallback(() => {
    return {
      save_preferences: async (params: Record<string, unknown>) => {
        try {
          const p =
            (params.parameters as Record<string, unknown>) || params;
          const response = await api.post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: { name: "save_preferences", parameters: p },
            },
          });
          const result = response.data.result || {};
          if (result.interviewId) {
            setInterviewId(result.interviewId);
            interviewIdRef.current = result.interviewId;
          }
          if (result.firstQuestion) setCurrentQuestion(result.firstQuestion);
          accumulatedAnswers.current = [];
          return JSON.stringify(result);
        } catch (err) {
          console.error("save_preferences error:", err);
          return JSON.stringify({
            error: true,
            message: "İşlem sırasında teknik sorun oluştu.",
          });
        }
      },

      save_answer: async (params: Record<string, unknown>) => {
        try {
          const p =
            (params.parameters as Record<string, unknown>) || params;
          accumulatedAnswers.current.push({
            question:
              (p.questionText as string) ||
              `Soru ${p.questionOrder}`,
            answer: (p.answer as string) || "",
            order:
              (p.questionOrder as number) ||
              accumulatedAnswers.current.length + 1,
            questionId: p.questionId as string | undefined,
          });

          const response = await api.post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: { name: "save_answer", parameters: p },
            },
          });
          const result = response.data.result || {};
          if (result.nextQuestion) setCurrentQuestion(result.nextQuestion);
          if (result.finished) setCurrentQuestion("");
          return JSON.stringify(result);
        } catch (err) {
          console.error("save_answer error:", err);
          return JSON.stringify({
            error: true,
            message: "Cevap kaydedilirken sorun oluştu.",
          });
        }
      },

      end_interview: async (params: Record<string, unknown>) => {
        try {
          const response = await api.post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: {
                name: "end_interview",
                parameters: {
                  interviewId:
                    params.interviewId || interviewIdRef.current,
                  answers:
                    params.answers || accumulatedAnswers.current,
                },
              },
            },
          });
          const result = response.data.result || {};
          const score =
            result.overallScore ?? result.score ?? result.overall_score;
          scoreSetRef.current = true;
          setOverallScore(score != null ? score : 0);
          accumulatedAnswers.current = [];
          return JSON.stringify(result);
        } catch (err) {
          console.error("end_interview error:", err);
          setOverallScore(0);
          return JSON.stringify({ error: true });
        }
      },
    };
  }, []);

  const startCall = useCallback(async () => {
    const cfg = configRef.current;
    if (!cfg.field) return;

    scoreSetRef.current = false;
    manualEndRef.current = false;
    setTranscript([]);
    setError(null);

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
    } catch {
      setError("Mülakat başlatılamadı, lütfen tekrar deneyin.");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Mikrofon erişimi reddedildi. Tarayıcı ayarlarından mikrofon iznini kontrol edin.");
      return;
    }

    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        clientTools: buildClientTools(),
        dynamicVariables: {
          interviewId: newInterviewId,
          field: cfg.field,
          techStack: cfg.techStack.join(", "),
          difficulty: cfg.difficulty,
        },
      });
    } catch (err) {
      console.error("ElevenLabs startSession failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("policy violation") || msg.includes("not allowed")) {
        setError("Agent konfigürasyon hatası. Lütfen ElevenLabs ayarlarını kontrol edin.");
      } else {
        setError("Ses bağlantısı kurulamadı. Lütfen tekrar deneyin.");
      }
    }
  }, [conversation, buildClientTools]);

  const endCall = useCallback(async () => {
    flushMessageBuffer();
    manualEndRef.current = true;

    const activeId = interviewIdRef.current;

    try {
      await conversation.endSession();
    } catch {
      // session may already be ended
    }

    if (activeId && !scoreSetRef.current) {
      try {
        const response = await api.post("/ai/vapi/webhook", {
          message: {
            type: "function-call",
            functionCall: {
              name: "end_interview",
              parameters: {
                interviewId: activeId,
                answers: accumulatedAnswers.current,
              },
            },
          },
        });
        const data = response.data;
        const score = data.result?.overallScore ?? data.result?.score;
        setOverallScore(score != null ? score : 0);
      } catch {
        setOverallScore(0);
      } finally {
        accumulatedAnswers.current = [];
      }
    } else if (!scoreSetRef.current) {
      setOverallScore(0);
    }
  }, [conversation, flushMessageBuffer]);

  const sendTextMessage = useCallback(
    (text: string) => {
      if (conversation.status === "connected" && text.trim()) {
        conversation.sendUserMessage(text);
      }
    },
    [conversation],
  );

  const toggleMic = useCallback(() => {
    // micMuted is managed by the SDK internally
    const next = !conversation.micMuted;
    conversation.setVolume({ volume: next ? 0 : 1 });
  }, [conversation]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  return {
    isConnected: conversation.status === "connected",
    isCallActive,
    isSpeaking: conversation.isSpeaking,
    micMuted: conversation.micMuted ?? false,
    toggleMic,
    agentStatus,
    currentQuestion,
    interviewId,
    overallScore,
    error,
    transcript,
    startCall,
    endCall,
    sendTextMessage,
    inputVolume,
    outputVolume,
  };
}
