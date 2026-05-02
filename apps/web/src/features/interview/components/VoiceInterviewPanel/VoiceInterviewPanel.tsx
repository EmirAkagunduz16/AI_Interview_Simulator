"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Clock,
} from "lucide-react";
import type { TranscriptMessage } from "../../hooks/useElevenLabs";

interface VoiceInterviewPanelProps {
  field: string;
  techStack: string[];
  difficulty: string;
  isConnected: boolean;
  isCallActive: boolean;
  isSpeaking: boolean;
  micMuted: boolean;
  agentStatus: "listening" | "thinking" | "speaking" | null;
  inputVolume: number;
  outputVolume: number;
  currentQuestion: string;
  error: string | null;
  transcript: TranscriptMessage[];
  onStartCall: () => void;
  onEndCall: () => void;
  onSendMessage: (text: string) => void;
  /** Called whenever the user types into the text box. Pauses agent TTS so a typed answer doesn't get overlapped by speech from a previous turn. */
  onUserTyping?: () => void;
  onToggleMic: () => void;
  onBack: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  junior: "Junior",
  intermediate: "Mid-Level",
  senior: "Senior",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  junior: "#4ade80",
  intermediate: "#facc15",
  senior: "#f87171",
};

const EMOTION_REGEX = /\[([^\]]+)\]/g;
const EMOTION_COLORS: Record<string, { bg: string; text: string }> = {
  happy: { bg: "#dcfce7", text: "#16a34a" },
  slow: { bg: "#fef9c3", text: "#ca8a04" },
  sad: { bg: "#fce7f3", text: "#db2777" },
  excited: { bg: "#dbeafe", text: "#2563eb" },
  serious: { bg: "#f3e8ff", text: "#7c3aed" },
  curious: { bg: "#ccfbf1", text: "#0d9488" },
  thoughtful: { bg: "#e0e7ff", text: "#4338ca" },
};

function renderMessageContent(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(EMOTION_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const tag = match[1] ?? match[0];
    const emotion = tag.toLowerCase();
    const colors = EMOTION_COLORS[emotion] || {
      bg: "#f1f5f9",
      text: "#475569",
    };
    parts.push(
      <span
        key={match.index}
        className="el-emotion-tag"
        style={{ background: colors.bg, color: colors.text }}
      >
        {tag}
      </span>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function VoiceInterviewPanel({
  field,
  techStack,
  difficulty,
  isConnected,
  isCallActive,
  isSpeaking,
  micMuted,
  agentStatus,
  inputVolume,
  outputVolume,
  error,
  transcript,
  onStartCall,
  onEndCall,
  onSendMessage,
  onUserTyping,
  onToggleMic,
  onBack,
}: VoiceInterviewPanelProps) {
  const difficultyLabel = DIFFICULTY_LABELS[difficulty] || difficulty;
  const difficultyColor = DIFFICULTY_COLORS[difficulty] || "#94a3b8";
  const [textInput, setTextInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCallActive) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isCallActive]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSend = () => {
    if (textInput.trim()) {
      onSendMessage(textInput.trim());
      setTextInput("");
    }
  };

  const orbScale = 1 + (isSpeaking ? outputVolume : inputVolume) * 0.12;
  const statusLabel = isConnected ? "Canlı" : "Bağlanıyor";
  const statusPct = isConnected ? "100%" : "...";

  return (
    <div className="el-panel">
      {/* Top Bar */}
      <header className="el-topbar">
        <div className="el-topbar-left">
          <button className="el-topbar-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Geri</span>
          </button>
        </div>

        <div className="el-topbar-center">
          <span className="el-topbar-title">Interviewer</span>
          <span className="el-topbar-sep">|</span>
          <span className="el-topbar-sub">
            {field} &middot; {techStack.join(", ") || "General"}
          </span>
          <span className="el-topbar-sep">|</span>
          <span
            className="el-topbar-difficulty"
            style={{ color: difficultyColor }}
          >
            {difficultyLabel}
          </span>
          <span className="el-topbar-sep">|</span>
          <span className={`el-topbar-live ${isConnected ? "active" : ""}`}>
            <span className="el-live-dot" />
            {statusLabel} {statusPct}
          </span>
        </div>

        <div className="el-topbar-right">
          <div className="el-topbar-timer">
            <Clock size={14} />
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>
      </header>

      {/* Main Content — split layout */}
      <div className="el-main">
        {/* Left Panel — Orb */}
        <div className="el-left">
          <div className="el-orb-area">
            {/* Orb */}
            <div
              className={`el-orb ${isSpeaking ? "speaking" : ""} ${agentStatus || ""}`}
              style={{ transform: `scale(${orbScale})` }}
            >
              <div className="el-orb-layer el-orb-layer-1" />
              <div className="el-orb-layer el-orb-layer-2" />
              <div className="el-orb-layer el-orb-layer-3" />
              <div className="el-orb-layer el-orb-layer-4" />
              <div className="el-orb-core" />
            </div>

            {/* Agent status */}
            <div className="el-agent-status">
              {agentStatus === "speaking" && "Konuşuyor..."}
              {agentStatus === "listening" && "Dinliyor..."}
              {agentStatus === "thinking" && "Düşünüyor..."}
              {!agentStatus && !isCallActive && "Bağlantı bekleniyor..."}
              {!agentStatus && isCallActive && "Hazır"}
            </div>
          </div>

          {/* End call button */}
          {isCallActive && (
            <button className="el-end-call" onClick={onEndCall}>
              <PhoneOff size={20} />
            </button>
          )}
          {!isCallActive && !isConnected && (
            <button className="el-start-call" onClick={onStartCall}>
              Yeniden Bağlan
            </button>
          )}

          {/* Bottom controls */}
          {isCallActive && (
            <div className="el-bottom-controls">
              <button
                className={`el-ctrl-btn el-mute-btn ${micMuted ? "muted" : ""}`}
                onClick={onToggleMic}
              >
                {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
                <span>{micMuted ? "Sessiz" : "Mikrofon"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Panel — Transcript */}
        <div className="el-right">
          {/* Error banner */}
          {error && <div className="el-error">{error}</div>}

          {/* Transcript area */}
          <div className="el-transcript">
            {transcript.length === 0 && (
              <div className="el-transcript-empty">
                <span className="el-started-label">Görüşme başladı</span>
                <p>Konuşma başladığında mesajlar burada görünecek.</p>
              </div>
            )}

            {transcript.length > 0 && (
              <div className="el-started-label">Görüşme başladı</div>
            )}

            {transcript.map((msg) => (
              <div
                key={msg.id}
                className={`el-msg ${msg.source === "ai" ? "el-msg-ai" : "el-msg-user"}`}
              >
                {msg.source === "ai" && (
                  <div className="el-msg-avatar">
                    <div className="el-avatar-dot" />
                  </div>
                )}
                <div className="el-msg-bubble">
                  {renderMessageContent(msg.message)}
                  {msg.streaming && <span className="el-streaming-cursor" />}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>

          {/* Text input */}
          <div className="el-input-area">
            <input
              type="text"
              placeholder="Mesaj yazın..."
              value={textInput}
              onChange={(e) => {
                const next = e.target.value;
                const wasEmpty = textInput.length === 0;
                setTextInput(next);
                // Only signal once when the user STARTS typing into an empty
                // box. Calling this on every keystroke caused the agent's TTS
                // to be cut repeatedly, producing choppy audio.
                if (wasEmpty && next.length > 0) {
                  onUserTyping?.();
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={!isCallActive}
            />
            <button
              className="el-send-btn"
              onClick={handleSend}
              disabled={!isCallActive || !textInput.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
