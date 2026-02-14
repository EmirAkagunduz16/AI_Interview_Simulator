"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";

interface VapiMessage {
  type: string;
  role?: string;
  transcript?: string;
  functionCall?: {
    name: string;
    parameters: Record<string, any>;
  };
  [key: string]: any;
}

interface TranscriptEntry {
  role: "assistant" | "user";
  text: string;
  timestamp: Date;
}

interface UseVapiOptions {
  publicKey: string;
  assistantId: string;
  assistantOverrides?: Record<string, any>;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onTranscript?: (entry: TranscriptEntry) => void;
  onFunctionCall?: (name: string, params: Record<string, any>) => void;
  onError?: (error: any) => void;
}

interface UseVapiReturn {
  start: () => Promise<void>;
  stop: () => void;
  isActive: boolean;
  isConnecting: boolean;
  transcript: TranscriptEntry[];
  isSpeaking: boolean;
  volumeLevel: number;
}

export function useVapi({
  publicKey,
  assistantId,
  assistantOverrides,
  onCallStart,
  onCallEnd,
  onTranscript,
  onFunctionCall,
  onError,
}: UseVapiOptions): UseVapiReturn {
  const vapiRef = useRef<Vapi | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    if (!publicKey) return;

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setIsConnecting(false);
      setIsActive(true);
      onCallStart?.();
    });

    vapi.on("call-end", () => {
      setIsActive(false);
      setIsConnecting(false);
      setIsSpeaking(false);
      onCallEnd?.();
    });

    vapi.on("message", (message: VapiMessage) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const entry: TranscriptEntry = {
          role: message.role as "assistant" | "user",
          text: message.transcript || "",
          timestamp: new Date(),
        };
        setTranscript((prev) => [...prev, entry]);
        onTranscript?.(entry);
      }

      if (message.type === "function-call" && message.functionCall) {
        onFunctionCall?.(
          message.functionCall.name,
          message.functionCall.parameters,
        );
      }
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));
    vapi.on("volume-level", (level: number) => setVolumeLevel(level));
    vapi.on("error", (error: any) => {
      setIsConnecting(false);
      onError?.(error);
    });

    return () => {
      vapi.stop();
      vapiRef.current = null;
    };
  }, [publicKey]);

  const start = useCallback(async () => {
    if (!vapiRef.current || !assistantId) return;
    setIsConnecting(true);
    setTranscript([]);
    try {
      await vapiRef.current.start(assistantId, assistantOverrides);
    } catch (error) {
      setIsConnecting(false);
      onError?.(error);
    }
  }, [assistantId, assistantOverrides]);

  const stop = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  return {
    start,
    stop,
    isActive,
    isConnecting,
    transcript,
    isSpeaking,
    volumeLevel,
  };
}
