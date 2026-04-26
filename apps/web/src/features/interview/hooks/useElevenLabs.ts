"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useConversation, type Language } from "@elevenlabs/react";
import api from "@/lib/axios";
import {
  normalizeTranscript,
  sanitizeAgentTranscript,
  isPlaceholderMessage,
  stripErroneousSentences,
} from "../config/transcript-normalizer";
import { applySessionLexicon } from "../config/dynamic-interview-lexicon";
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

/**
 * Send silence from the mic while the agent’s turn is marked "speaking" so speaker→mic echo
 * does not trigger VAD. **Opt-in only** — default off so the agent reliably hears you and
 * barge-in works; enable if you use loudspeakers and get false interruptions.
 */
const SUPPRESS_MIC_WHILE_AGENT_SPEAKS =
  process.env.NEXT_PUBLIC_VOICE_SUPPRESS_MIC_WHILE_AGENT_SPEAKS === "true";

/** After the agent switches to "listening", keep the gate briefly (echo tail). Only if suppression is on. */
const POST_AGENT_SPEECH_MS = (() => {
  const n = Number.parseInt(
    process.env.NEXT_PUBLIC_VOICE_POST_AGENT_SPEECH_MS || "280",
    10,
  );
  return Number.isFinite(n) && n >= 0 ? n : 280;
})();

const CONNECTION_TYPE =
  process.env.NEXT_PUBLIC_ELEVENLABS_USE_WEBRTC === "true"
    ? ("webrtc" as const)
    : ("websocket" as const);

/** Biases ASR + voice pipeline toward Turkish (code-switch with English stack names). */
const ELEVENLABS_AGENT_LANGUAGE = (
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_LANGUAGE?.trim() || "tr"
) as Language;

/**
 * ElevenLabs can emit multiple assistant `onMessage` texts for one spoken turn (draft → final).
 * TTS often plays only the last; keep the transcript aligned by superseding the prior bubble.
 */
const AI_TRANSCRIPT_COALESCE_MS = 12_000;

export function useElevenLabs(
  config: UseElevenLabsConfig,
): UseElevenLabsReturn {
  const [isCallActive, setIsCallActive] = useState(false);
  const [userMicMuted, setUserMicMuted] = useState(false);
  const [playbackMicGate, setPlaybackMicGate] = useState(false);
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

  /**
   * ElevenLabs agent often omits interviewId / wrong field in tool calls.
   * We pre-create the interview in startCall — always attach that id so
   * save_preferences does not create a duplicate (e.g. default "fullstack").
   */
  const mergeToolCallParameters = useCallback(
    (
      parameters: Record<string, unknown>,
      options?: { syncConfigIntoSavePreferences?: boolean },
    ): Record<string, unknown> => {
      const merged: Record<string, unknown> = { ...parameters };
      const id = interviewIdRef.current;
      if (id) merged.interviewId = id;
      if (options?.syncConfigIntoSavePreferences && id) {
        const cfg = configRef.current;
        if (cfg.field) merged.field = cfg.field;
        if (cfg.techStack?.length) merged.techStack = [...cfg.techStack];
        if (cfg.difficulty) merged.difficulty = cfg.difficulty;
      }
      return merged;
    },
    [],
  );

  const manualEndRef = useRef(false);
  const scoreSetRef = useRef(false);
  const accumulatedAnswers = useRef<AccumulatedAnswer[]>([]);

  const messageBufferRef = useRef<{
    role: string;
    chunks: string[];
    lastTimestamp: number;
  } | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackGateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  /** Latest conversation API (for contextual hooks that run inside `useConversation` callbacks). */
  const conversationApiRef = useRef<{ sendContextualUpdate: (t: string) => void } | null>(
    null,
  );

  const micMutedForSdk =
    userMicMuted ||
    (SUPPRESS_MIC_WHILE_AGENT_SPEAKS ? playbackMicGate : false);

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

  /**
   * Persists official bank soru metnini backend transcript buffer’a yazar.
   * UI’da **ayrı balon eklemez** — aksi halde TTS’in söylemediği “hayalet” satırlar oluşuyordu
   * (SDK metin ile ses farklı seçebilir). Görünen metin yalnızca `onMessage`.
   */
  const persistCanonicalAgentText = useCallback(
    async (raw: string) => {
      const text = normalizeTranscript(sanitizeAgentTranscript(raw?.trim() || ""));
      if (text.length < 8) return;

      const currentId = interviewIdRef.current;
      if (!currentId) return;

      const normalized = text;
      const now = Date.now();
      if (messageBufferRef.current && messageBufferRef.current.role !== "agent") {
        await flushMessageBuffer();
      }
      if (!messageBufferRef.current) {
        messageBufferRef.current = {
          role: "agent",
          chunks: [],
          lastTimestamp: now,
        };
      }
      const buf = messageBufferRef.current;
      const lastChunk = buf.chunks[buf.chunks.length - 1];
      if (
        lastChunk &&
        (normalized.startsWith(lastChunk) || lastChunk.startsWith(normalized))
      ) {
        buf.chunks[buf.chunks.length - 1] =
          normalized.length >= lastChunk.length ? normalized : lastChunk;
      } else {
        buf.chunks.push(normalized);
      }
      buf.lastTimestamp = now;
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(flushMessageBuffer, 3000);
    },
    [flushMessageBuffer],
  );

  const conversation = useConversation({
    micMuted: micMutedForSdk,
    preferHeadphonesForIosDevices: true,
    onConnect: (props: { conversationId: string }) => {
      console.info(
        "[ElevenLabs] Connected — conversationId:",
        props.conversationId,
        "agentId:",
        AGENT_ID,
      );
      setIsCallActive(true);
      setError(null);
      const cfg = configRef.current;
      const sttHint =
        `Oturum: ${cfg.field}. Teknik anahtar kelimeler: ${cfg.techStack.join(", ")}. ` +
        `Aday Türkçe konuşuyor; İngilizce ürün adları bekleniyor.`;
      queueMicrotask(() => {
        try {
          conversationApiRef.current?.sendContextualUpdate(sttHint);
        } catch {
          /* noop */
        }
      });
    },
    onDisconnect: async (details: { reason: string; message?: string }) => {
      console.info("[ElevenLabs] Disconnected —", details);
      // Flush pending messages before end_interview so chat history is complete
      await flushMessageBuffer();
      setIsCallActive(false);
      setAgentStatus(null);
      setUserMicMuted(false);
      setPlaybackMicGate(false);
      if (playbackGateTimerRef.current) {
        clearTimeout(playbackGateTimerRef.current);
        playbackGateTimerRef.current = null;
      }

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

      const source = message.source === "ai" ? "ai" : "user";
      // Strip hallucinated sentences ("cumhurbaşkanlığı...", "geçiş yapılıyor...",
      // off-topic political/election content) ONLY for the agent — never
      // silently mutate the user's transcript.
      const originalAgentText =
        source === "ai" ? message.message.trim() : "";
      const raw =
        source === "ai"
          ? stripErroneousSentences(originalAgentText)
          : message.message.trim();

      // Whole agent turn was hallucinated off-topic → drop it from UI and
      // nudge the agent back to the current interview question. Without this
      // the user only hears the irrelevant audio (e.g. an election paragraph)
      // and the agent has no signal that the topic drifted.
      if (source === "ai" && originalAgentText && !raw) {
        const cfg = configRef.current;
        const hint =
          `[SYSTEM REFOCUS] Konu dışı bir cümle algılandı ve atlandı. ` +
          `Mülakat: ${cfg.field} / ${cfg.techStack.join(", ") || "genel"} / ${cfg.difficulty}. ` +
          `Lütfen şu anki teknik soruya geri dön; siyaset, seçim, gündem gibi konulara değinme.`;
        try {
          conversationApiRef.current?.sendContextualUpdate(hint);
        } catch {
          /* noop */
        }
        console.warn(
          "[ElevenLabs] Off-topic agent turn stripped, sent refocus hint:",
          originalAgentText.slice(0, 120),
        );
        return;
      }
      if (!raw) return;
      const content =
        source === "ai"
          ? normalizeTranscript(sanitizeAgentTranscript(raw))
          : applySessionLexicon(
              normalizeTranscript(raw),
              configRef.current,
            );
      if (!content) return;
      const role = source === "ai" ? "agent" : "user";

      const dedupRef = { skip: false, replace: false, finalContent: content };
      let msg: TranscriptMessage;

      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.source === source) {
          const lastContent = last.message.trim();
          if (lastContent === content) {
            dedupRef.skip = true;
            return prev;
          }
          // Only merge consecutive turns when one is a clear streaming extension of the other
          const extendsForward =
            content.startsWith(lastContent) && content.length > lastContent.length;
          const isPartialDuplicate =
            lastContent.startsWith(content) && lastContent.length > content.length;
          if (extendsForward || isPartialDuplicate) {
            dedupRef.replace = true;
            dedupRef.finalContent =
              content.length > lastContent.length ? content : lastContent;
            const next = [...prev];
            next[next.length - 1] = { ...last, message: dedupRef.finalContent };
            return next;
          }
          if (
            source === "ai" &&
            Date.now() - last.timestamp < AI_TRANSCRIPT_COALESCE_MS
          ) {
            dedupRef.replace = true;
            dedupRef.finalContent = content;
            const next = [...prev];
            next[next.length - 1] = {
              ...last,
              message: content,
              timestamp: Date.now(),
            };
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
        setAgentStatus("speaking");
        if (SUPPRESS_MIC_WHILE_AGENT_SPEAKS) {
          if (playbackGateTimerRef.current) {
            clearTimeout(playbackGateTimerRef.current);
            playbackGateTimerRef.current = null;
          }
          setPlaybackMicGate(true);
        }
      } else {
        modeDebounceRef.current = setTimeout(() => {
          setAgentStatus("listening");
          modeDebounceRef.current = null;
        }, 450);
        if (SUPPRESS_MIC_WHILE_AGENT_SPEAKS) {
          if (playbackGateTimerRef.current) {
            clearTimeout(playbackGateTimerRef.current);
          }
          playbackGateTimerRef.current = setTimeout(() => {
            setPlaybackMicGate(false);
            playbackGateTimerRef.current = null;
          }, POST_AGENT_SPEECH_MS);
        }
      }
    },
    onUnhandledClientToolCall: (params: unknown) => {
      console.warn("[ElevenLabs] Unhandled client tool call:", params);
    },
    onDebug: (props: unknown) => {
      console.debug("[ElevenLabs debug]", props);
    },
  });

  conversationApiRef.current = conversation;

  const disconnectVoiceAndResetUi = useCallback(async () => {
    await flushMessageBuffer();
    try {
      await conversation.endSession();
    } catch {
      /* already disconnected */
    }
    setIsCallActive(false);
    setAgentStatus(null);
    setUserMicMuted(false);
    setPlaybackMicGate(false);
    if (playbackGateTimerRef.current) {
      clearTimeout(playbackGateTimerRef.current);
      playbackGateTimerRef.current = null;
    }
    if (modeDebounceRef.current) {
      clearTimeout(modeDebounceRef.current);
      modeDebounceRef.current = null;
    }
  }, [conversation, flushMessageBuffer]);

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

  useEffect(() => {
    if (!isCallActive || !SUPPRESS_MIC_WHILE_AGENT_SPEAKS) {
      if (playbackGateTimerRef.current) {
        clearTimeout(playbackGateTimerRef.current);
        playbackGateTimerRef.current = null;
      }
      setPlaybackMicGate(false);
    }
  }, [isCallActive]);

  const buildClientTools = useCallback(() => {
    return {
      save_preferences: async (parameters: Record<string, unknown>) => {
        const payload = mergeToolCallParameters(parameters, {
          syncConfigIntoSavePreferences: true,
        });
        console.debug("[ClientTool] save_preferences merged:", payload);
        try {
          const response = await api.post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: {
                name: "save_preferences",
                parameters: payload,
              },
            },
          });
          const result = response.data.result || {};
          console.debug("[ClientTool] save_preferences result:", result);
          if (result.interviewId) {
            setInterviewId(result.interviewId);
            interviewIdRef.current = result.interviewId;
          }
          if (result.firstQuestion) {
            setCurrentQuestion(result.firstQuestion as string);
            await persistCanonicalAgentText(result.firstQuestion as string);
          }
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

        // Accumulate answer locally (always succeeds, no network)
        const accAnswer: AccumulatedAnswer = {
          question:
            (parameters.questionText as string) ||
            `Soru ${parameters.questionOrder}`,
          answer: (parameters.answer as string) || "",
          order:
            (parameters.questionOrder as number) ||
            accumulatedAnswers.current.length + 1,
          questionId: parameters.questionId as string | undefined,
        };
        accumulatedAnswers.current.push(accAnswer);

        // Fire backend API call in background (don't await — return fast
        // so ElevenLabs SDK doesn't hit response_timeout_secs)
        api
          .post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: {
                name: "save_answer",
                parameters: mergeToolCallParameters(parameters),
              },
            },
          })
          .then(async (response) => {
            const result = response.data.result || {};
            console.debug("[ClientTool] save_answer bg result:", result);
            if (result.nextQuestion) {
              setCurrentQuestion(result.nextQuestion as string);
              await persistCanonicalAgentText(result.nextQuestion as string);
            }
            if (result.finished) setCurrentQuestion("");
          })
          .catch((err: unknown) => {
            console.warn("[ClientTool] save_answer bg save failed:", err);
          });

        // Return immediately so ElevenLabs agent can proceed
        // The nextQuestion text is already known from save_preferences
        return JSON.stringify({
          success: true,
          message: "Cevap kaydedildi.",
          questionOrder: accAnswer.order,
        });
      },

      end_interview: async (parameters: Record<string, unknown>) => {
        console.debug("[ClientTool] end_interview called with:", parameters);
        // Disconnect AFTER returning, otherwise the ElevenLabs SDK tries to
        // send our return value back through a closed WebRTC peer connection
        // and surfaces "UnexpectedConnectionState: PC manager is closed".
        const scheduleDisconnect = () => {
          setTimeout(() => {
            void disconnectVoiceAndResetUi();
          }, 250);
        };
        try {
          const response = await api.post("/ai/vapi/webhook", {
            message: {
              type: "function-call",
              functionCall: {
                name: "end_interview",
                parameters: mergeToolCallParameters({
                  ...parameters,
                  answers:
                    parameters.answers ?? accumulatedAnswers.current,
                }),
              },
            },
          });
          const result = response.data.result || {};
          const score =
            result.overallScore ?? result.score ?? result.overall_score;
          scoreSetRef.current = true;
          setOverallScore(score != null ? score : 0);
          accumulatedAnswers.current = [];
          scheduleDisconnect();
          return JSON.stringify(result);
        } catch (err) {
          console.error("end_interview error:", err);
          setOverallScore(0);
          scheduleDisconnect();
          return JSON.stringify({ error: true });
        }
      },
    };
  }, [persistCanonicalAgentText, mergeToolCallParameters, disconnectVoiceAndResetUi]);

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
          interviewSttVocabulary: cfg.techStack.join(", "),
          interviewFieldLabel: cfg.field,
        },
        overrides: {
          agent: { language: ELEVENLABS_AGENT_LANGUAGE },
        },
      };
    } else {
      if (!AGENT_ID) {
        setError("ElevenLabs agent kimliği yapılandırılmamış.");
        return;
      }
      sessionConfig = {
        agentId: AGENT_ID,
        connectionType: CONNECTION_TYPE,
        clientTools: buildClientTools(),
        dynamicVariables: {
          interviewId: newInterviewId,
          field: cfg.field,
          techStack: cfg.techStack.join(", "),
          difficulty: cfg.difficulty,
          JSON_stringify_techStack_: JSON.stringify(cfg.techStack),
          interviewSttVocabulary: cfg.techStack.join(", "),
          interviewFieldLabel: cfg.field,
        },
        overrides: {
          agent: { language: ELEVENLABS_AGENT_LANGUAGE },
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
    await flushMessageBuffer();

    const activeId = interviewIdRef.current;

    try {
      await conversation.endSession();
    } catch {
      // session may already be ended
    }
    setIsCallActive(false);
    setAgentStatus(null);
    setPlaybackMicGate(false);
    setUserMicMuted(false);
    if (playbackGateTimerRef.current) {
      clearTimeout(playbackGateTimerRef.current);
      playbackGateTimerRef.current = null;
    }
    if (modeDebounceRef.current) {
      clearTimeout(modeDebounceRef.current);
      modeDebounceRef.current = null;
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
    setUserMicMuted((prev) => !prev);
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (modeDebounceRef.current) clearTimeout(modeDebounceRef.current);
      if (playbackGateTimerRef.current) {
        clearTimeout(playbackGateTimerRef.current);
        playbackGateTimerRef.current = null;
      }
    };
  }, []);

  return {
    isConnected: conversation.status === "connected",
    isCallActive,
    isSpeaking: conversation.isSpeaking,
    micMuted: userMicMuted,
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
