"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import api from "@/lib/axios";
import {
  normalizeTranscript,
  isPlaceholderMessage,
  containsErroneousContent,
} from "../config/transcript-normalizer";
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
  /** True when message is still streaming (real-time) */
  streaming?: boolean;
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

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export function useElevenLabs(
  config: UseElevenLabsConfig,
): UseElevenLabsReturn {
  const [isCallActive, setIsCallActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
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
  const streamingAgentIdRef = useRef<string | null>(null);
  const modeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushMessageBuffer = useCallback((): Promise<void> => {
    const buffer = messageBufferRef.current;
    const currentId = interviewIdRef.current;
    if (!buffer || buffer.chunks.length === 0 || !currentId) {
      return Promise.resolve();
    }

    const content = buffer.chunks.join(" ");
    const role = buffer.role;
    messageBufferRef.current = null;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    return api
      .post(`/interviews/${currentId}/messages`, { role, content })
      .catch((err: unknown) =>
        console.warn("Failed to save transcript message:", err),
      )
      .then(() => undefined);
  }, []);

  const conversation = useConversation({
    micMuted,
    onConnect: (props: { conversationId: string }) => {
      console.info(
        "[ElevenLabs] Connected — conversationId:",
        props.conversationId,
        "agentId:",
        AGENT_ID,
      );
      setIsCallActive(true);
      setError(null);
    },
    onDisconnect: async (details: { reason: string; message?: string }) => {
      console.info("[ElevenLabs] Disconnected —", details);
      // Flush pending messages before end_interview so chat history is complete
      await flushMessageBuffer();
      setIsCallActive(false);
      setAgentStatus(null);
      setMicMuted(false);

      if (!manualEndRef.current && !scoreSetRef.current) {
        const activeId = interviewIdRef.current;
        if (activeId) {
          try {
            const res = await api.post("/ai/vapi/webhook", {
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
            const score =
              res.data.result?.overallScore ?? res.data.result?.score;
            setOverallScore(score != null ? score : 0);
          } catch {
            setOverallScore(0);
          } finally {
            accumulatedAnswers.current = [];
          }
        }
      }
      manualEndRef.current = false;
    },
    onMessage: (message: {
      message: string;
      source: "user" | "ai";
      role?: string;
    }) => {
      if (!message.message) return;
      // Skip placeholder messages (e.g. "..." from speech recognition when user hasn't spoken)
      if (isPlaceholderMessage(message.message)) return;
      // Skip erroneous/hallucinated content (e.g. from misconfigured agent)
      if (containsErroneousContent(message.message)) return;

      const source = message.source === "ai" ? "ai" : "user";
      const content = message.message.trim();
      const role = source === "ai" ? "agent" : "user";

      const dedupRef = { skip: false, replace: false, finalContent: content };
      let msg: TranscriptMessage;

      if (source === "ai" && streamingAgentIdRef.current) {
        setTranscript((prev) => {
          const idx = prev.findIndex((m) => m.id === streamingAgentIdRef.current);
          if (idx >= 0) {
            const next = [...prev];
            const cur = next[idx];
            if (cur) {
              next[idx] = { ...cur, message: content, streaming: false };
            }
            streamingAgentIdRef.current = null;
            return next;
          }
          return [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, source: "ai" as const, message: content, timestamp: Date.now() }];
        });
        msg = { id: "temp", source: "ai", message: content, timestamp: Date.now() };
      } else {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.source === source) {
            const lastContent = last.message.trim();
            if (lastContent === content) {
              dedupRef.skip = true;
              return prev;
            }
            if (content.startsWith(lastContent) || lastContent.startsWith(content)) {
              dedupRef.replace = true;
              dedupRef.finalContent =
                content.length > lastContent.length ? content : lastContent;
              const next = [...prev];
              next[next.length - 1] = { ...last, message: dedupRef.finalContent };
              return next;
            }
          }
          return [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source,
              message: content,
              timestamp: Date.now(),
            },
          ];
        });
        if (dedupRef.skip) return;
        msg = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source,
          message: dedupRef.replace ? dedupRef.finalContent : content,
          timestamp: Date.now(),
        };
      }

      const currentId = interviewIdRef.current;
      if (currentId) {
        const normalized = normalizeTranscript(msg.message);
        const now = Date.now();
        const buffer = messageBufferRef.current;

        if (
          buffer &&
          (buffer.role !== role || now - buffer.lastTimestamp >= 3000)
        ) {
          flushMessageBuffer();
        }

        if (!messageBufferRef.current) {
          messageBufferRef.current = { role, chunks: [], lastTimestamp: now };
        }
        if (dedupRef.replace && buffer?.role === role && buffer.chunks.length > 0) {
          buffer.chunks[buffer.chunks.length - 1] = normalized;
        } else {
          messageBufferRef.current.chunks.push(normalized);
        }
        messageBufferRef.current.lastTimestamp = now;

        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(flushMessageBuffer, 3000);
      }
    },
    onError: (message: string, context?: unknown) => {
      console.error("[ElevenLabs] Error:", message, context);

      if (message.includes("max_duration_exceeded")) {
        setError("Mülakat süresi doldu.");
      } else if (
        message.includes("policy violation") ||
        message.includes("not allowed")
      ) {
        setError("Agent konfigürasyon hatası oluştu.");
      } else if (
        message.includes("RTC path not found") ||
        message.includes("Retrying")
      ) {
        return;
      } else {
        setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      }
    },
    onModeChange: (prop: { mode: "speaking" | "listening" }) => {
      if (modeDebounceRef.current) {
        clearTimeout(modeDebounceRef.current);
        modeDebounceRef.current = null;
      }
      if (prop.mode === "speaking") {
        // AI started speaking — update immediately
        setAgentStatus("speaking");
      } else {
        // AI switched to listening — debounce to prevent flicker from ambient noise
        modeDebounceRef.current = setTimeout(() => {
          setAgentStatus("listening");
          modeDebounceRef.current = null;
        }, 350);
      }
    },
    onUnhandledClientToolCall: (params: unknown) => {
      console.warn("[ElevenLabs] Unhandled client tool call:", params);
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
      save_preferences: async (parameters: Record<string, unknown>) => {
        console.debug("[ClientTool] save_preferences called with:", parameters);
        try {
          const response = await api.post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: {
                name: "save_preferences",
                parameters,
              },
            },
          });
          const result = response.data.result || {};
          console.debug("[ClientTool] save_preferences result:", result);
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

      save_answer: async (parameters: Record<string, unknown>) => {
        console.debug("[ClientTool] save_answer called with:", parameters);
        try {
          accumulatedAnswers.current.push({
            question:
              (parameters.questionText as string) ||
              `Soru ${parameters.questionOrder}`,
            answer: (parameters.answer as string) || "",
            order:
              (parameters.questionOrder as number) ||
              accumulatedAnswers.current.length + 1,
            questionId: parameters.questionId as string | undefined,
          });

          const response = await api.post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: {
                name: "save_answer",
                parameters,
              },
            },
          });
          const result = response.data.result || {};
          console.debug("[ClientTool] save_answer result:", result);
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

      end_interview: async (parameters: Record<string, unknown>) => {
        console.debug("[ClientTool] end_interview called with:", parameters);
        try {
          const response = await api.post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: {
                name: "end_interview",
                parameters: {
                  interviewId: parameters.interviewId || interviewIdRef.current,
                  answers: parameters.answers || accumulatedAnswers.current,
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setError(
        "Mikrofon erişimi reddedildi. Tarayıcı ayarlarından mikrofon iznini kontrol edin.",
      );
      return;
    }

    // Resmi ElevenLabs dokümantasyonu: Public agent için agentId yeterli (signed URL gerekmez).
    // Private agent ise 401 alırsınız → NEXT_PUBLIC_ELEVENLABS_USE_SIGNED_URL=true yapın.
    const useSignedUrl =
      process.env.NEXT_PUBLIC_ELEVENLABS_USE_SIGNED_URL === "true";

    let sessionConfig: Parameters<typeof conversation.startSession>[0];

    if (useSignedUrl) {
      let signedUrl: string;
      try {
        const signedRes = await api.get<{ signedUrl: string }>(
          `/ai/elevenlabs/signed-url`,
          { params: { agentId: AGENT_ID } },
        );
        signedUrl = signedRes.data.signedUrl;
        if (!signedUrl) {
          setError("ElevenLabs bağlantı bilgisi alınamadı.");
          return;
        }
      } catch (err) {
        console.error("[ElevenLabs] Signed URL fetch failed:", err);
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || (err instanceof Error ? err.message : String(err));
        if (msg.includes("API key not configured")) {
          setError(
            "ElevenLabs API anahtarı sunucuda yapılandırılmamış. ELEVENLABS_API_KEY ekleyin.",
          );
        } else if (msg.includes("401") || msg.includes("Unauthorized")) {
          setError(
            "ElevenLabs API anahtarı geçersiz. Lütfen elevenlabs.io hesabınızdan doğru anahtarı kullanın.",
          );
        } else {
          setError("Ses bağlantısı kurulamadı. Lütfen tekrar deneyin.");
        }
        return;
      }

      sessionConfig = {
        signedUrl,
        connectionType: "websocket" as const,
        clientTools: buildClientTools(),
        dynamicVariables: {
          interviewId: newInterviewId,
          field: cfg.field,
          techStack: cfg.techStack.join(", "),
          difficulty: cfg.difficulty,
          JSON_stringify_techStack_: JSON.stringify(cfg.techStack),
        },
      };
    } else {
      sessionConfig = {
        agentId: AGENT_ID,
        connectionType: "websocket" as const,
        clientTools: buildClientTools(),
        dynamicVariables: {
          interviewId: newInterviewId,
          field: cfg.field,
          techStack: cfg.techStack.join(", "),
          difficulty: cfg.difficulty,
          JSON_stringify_techStack_: JSON.stringify(cfg.techStack),
        },
      };
    }

    console.info(
      "[ElevenLabs] Starting session",
      useSignedUrl ? "(signed URL)" : "(agentId direct)",
      "agentId:",
      AGENT_ID,
      "dynamicVariables:",
      sessionConfig.dynamicVariables,
    );

    try {
      const convId = await conversation.startSession(sessionConfig);
      console.info("[ElevenLabs] Session started, convId:", convId);
    } catch (err) {
      console.error("[ElevenLabs] startSession failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401") || msg.includes("authentication")) {
        setError(
          "Agent kimlik doğrulama gerektiriyor. .env'e NEXT_PUBLIC_ELEVENLABS_USE_SIGNED_URL=true ekleyin.",
        );
      } else if (msg.includes("policy violation") || msg.includes("not allowed")) {
        setError(
          "Agent konfigürasyon hatası. Lütfen ElevenLabs ayarlarını kontrol edin.",
        );
      } else if (
        msg.includes("Connection closed unexpectedly") ||
        msg.includes("session could not be established")
      ) {
        setError(
          "WebSocket bağlantısı kurulamadı. ElevenLabs API anahtarında 'ElevenAgents - Write' izninin açık olduğundan emin olun.",
        );
      } else {
        setError("Ses bağlantısı kurulamadı. Lütfen tekrar deneyin.");
      }
    }
  }, [conversation, buildClientTools]);

  const endCall = useCallback(async () => {
    manualEndRef.current = true;
    // Flush messages before disconnect so chat history is saved
    await flushMessageBuffer();

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
        const userMsg: TranscriptMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source: "user",
          message: text.trim(),
          timestamp: Date.now(),
        };
        setTranscript((prev) => [...prev, userMsg]);

        const currentId = interviewIdRef.current;
        if (currentId) {
          const normalized = normalizeTranscript(userMsg.message);
          const now = Date.now();
          const buffer = messageBufferRef.current;
          if (
            buffer &&
            (buffer.role !== "user" || now - buffer.lastTimestamp >= 3000)
          ) {
            flushMessageBuffer();
          }
          if (!messageBufferRef.current) {
            messageBufferRef.current = {
              role: "user",
              chunks: [],
              lastTimestamp: now,
            };
          }
          messageBufferRef.current.chunks.push(normalized);
          messageBufferRef.current.lastTimestamp = now;
          if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
          flushTimerRef.current = setTimeout(flushMessageBuffer, 3000);
        }

        conversation.sendUserMessage(text.trim());
      }
    },
    [conversation, flushMessageBuffer],
  );

  const toggleMic = useCallback(() => {
    setMicMuted((prev) => !prev);
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (modeDebounceRef.current) clearTimeout(modeDebounceRef.current);
    };
  }, []);

  return {
    isConnected: conversation.status === "connected",
    isCallActive,
    isSpeaking: conversation.isSpeaking,
    micMuted,
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
