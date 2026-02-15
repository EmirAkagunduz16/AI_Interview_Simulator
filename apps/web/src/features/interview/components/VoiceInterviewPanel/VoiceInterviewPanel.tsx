"use client";

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

  return (
    <div className="interview-container">
      {/* Header */}
      <div className="interview-header">
        <div className="interview-info">
          <span className="field-badge">
            {fieldInfo?.icon} {fieldInfo?.label}
          </span>
          <span className="tech-list">
            {techStack.join(" • ") || "General"}
          </span>
        </div>
        <div className="call-status">
          <span
            className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
          />
          {isConnected ? "Bağlı" : "Bağlanıyor..."}
        </div>
      </div>

      {/* Voice Visualizer */}
      <div className="voice-area">
        <div
          className={`voice-orb ${isSpeaking ? "speaking" : ""} ${isCallActive ? "active" : ""}`}
        >
          <div
            className="orb-inner"
            style={{ transform: `scale(${1 + volumeLevel * 0.3})` }}
          >
            <div className="orb-pulse" />
            <div className="orb-core">
              {isSpeaking ? "🗣️" : isCallActive ? "🎤" : "⏳"}
            </div>
          </div>
        </div>

        {/* Volume Bars */}
        <div className="volume-bars">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="volume-bar"
              style={{
                height: `${Math.max(4, volumeLevel * 60 * Math.sin((i / 12) * Math.PI))}px`,
                opacity: volumeLevel > 0.05 ? 0.8 : 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="question-display">
          <span className="question-label">Güncel Soru</span>
          <p className="question-text">{currentQuestion}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="interview-controls">
        {!isCallActive && (
          <button className="start-call-btn" onClick={onStartCall}>
            🎙️ Yeniden Bağlan
          </button>
        )}
        <button className="end-call-btn" onClick={onEndCall}>
          🚪 Mülakatı Bitir & Sonuçları Gör
        </button>
      </div>
    </div>
  );
}
