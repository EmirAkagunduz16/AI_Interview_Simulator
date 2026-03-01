"use client";

import {
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  AlertCircle,
  Radio,
  Clock,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { FIELDS } from "../../data/interviewConfig";

interface VoiceInterviewPanelProps {
  field: string;
  techStack: string[];
  isConnected: boolean;
  isCallActive: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  currentQuestion: string;
  error: string | null;
  onStartCall: () => void;
  onEndCall: () => void;
}

export default function VoiceInterviewPanel({
  field,
  techStack,
  isConnected,
  isCallActive,
  isSpeaking,
  volumeLevel,
  currentQuestion,
  error,
  onStartCall,
  onEndCall,
}: VoiceInterviewPanelProps) {
  const fieldInfo = FIELDS.find((f) => f.id === field);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isCallActive) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const statusText = isSpeaking
    ? "AI Konuşuyor..."
    : isCallActive
      ? "Dinliyor — Konuşabilirsiniz"
      : "Bağlantı bekleniyor...";

  return (
    <div className="voice-panel">
      {/* Top Bar */}
      <div className="voice-topbar">
        <div className="topbar-left">
          <div className="topbar-badge">
            <Radio size={14} />
            <span>Canlı Mülakat</span>
          </div>
          <div className="topbar-field">
            {fieldInfo?.label} • {techStack.join(", ") || "General"}
          </div>
        </div>
        <div className="topbar-right">
          <div className="topbar-timer">
            <Clock size={14} />
            <span>{formatTime(elapsed)}</span>
          </div>
          <div
            className={`topbar-connection ${isConnected ? "connected" : ""}`}
          >
            <span className="conn-dot" />
            {isConnected ? "Bağlı" : "Bağlanıyor..."}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="voice-main">
        {/* Orb */}
        <div className="voice-center">
          <div
            className={`orb-wrapper ${isSpeaking ? "speaking" : ""} ${isCallActive ? "active" : ""}`}
          >
            {/* Animated rings */}
            <div
              className="orb-ring ring-1"
              style={{ transform: `scale(${1 + volumeLevel * 0.5})` }}
            />
            <div
              className="orb-ring ring-2"
              style={{ transform: `scale(${1 + volumeLevel * 0.35})` }}
            />
            <div
              className="orb-ring ring-3"
              style={{ transform: `scale(${1 + volumeLevel * 0.2})` }}
            />

            <div
              className="orb-core"
              style={{ transform: `scale(${1 + volumeLevel * 0.15})` }}
            >
              {isSpeaking ? (
                <Mic size={32} strokeWidth={1.5} />
              ) : isCallActive ? (
                <MicOff size={32} strokeWidth={1.5} />
              ) : (
                <Mic size={32} strokeWidth={1.5} />
              )}
            </div>
          </div>

          {/* Status text */}
          <div className="voice-status">
            <span className={`status-text ${isSpeaking ? "speaking" : ""}`}>
              {statusText}
            </span>
          </div>

          {/* Volume visualizer */}
          <div className="voice-visualizer">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="viz-bar"
                style={{
                  height: `${Math.max(3, volumeLevel * 50 * Math.sin((i / 24) * Math.PI))}px`,
                  opacity:
                    volumeLevel > 0.05
                      ? 0.7 + Math.sin((i / 24) * Math.PI) * 0.3
                      : 0.15,
                }}
              />
            ))}
          </div>
        </div>

        {/* Question panel */}
        {currentQuestion && (
          <div className="question-panel">
            <div className="question-header">
              <MessageSquare size={14} />
              <span>Güncel Soru</span>
            </div>
            <p className="question-content">{currentQuestion}</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="voice-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="voice-controls">
        {!isCallActive && (
          <button className="ctrl-btn ctrl-reconnect" onClick={onStartCall}>
            <Phone size={18} />
            <span>Yeniden Bağlan</span>
          </button>
        )}
        <button className="ctrl-btn ctrl-end" onClick={onEndCall}>
          <PhoneOff size={18} />
          <span>Mülakatı Bitir</span>
        </button>
      </div>
    </div>
  );
}
