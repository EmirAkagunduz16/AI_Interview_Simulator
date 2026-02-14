"use client";

import { useState, useRef, useEffect } from "react";
import { useVapi } from "@/hooks/useVapi";
import "./interview.scss";

const FIELDS = [
  { id: "backend", label: "Backend", icon: "🖥️" },
  { id: "frontend", label: "Frontend", icon: "🎨" },
  { id: "fullstack", label: "Fullstack", icon: "⚡" },
  { id: "mobile", label: "Mobile", icon: "📱" },
  { id: "devops", label: "DevOps", icon: "🔧" },
  { id: "data_science", label: "Data Science", icon: "📊" },
];

const TECH_OPTIONS: Record<string, string[]> = {
  backend: [
    "Node.js",
    "NestJS",
    "Express",
    "Python",
    "Django",
    "FastAPI",
    "Java",
    "Spring Boot",
    "Go",
    "Rust",
    "C#",
    ".NET",
  ],
  frontend: [
    "React",
    "Next.js",
    "Vue.js",
    "Angular",
    "Svelte",
    "TypeScript",
    "Tailwind CSS",
    "Material UI",
  ],
  fullstack: [
    "React",
    "Next.js",
    "Node.js",
    "NestJS",
    "TypeScript",
    "Python",
    "Django",
    "Vue.js",
    "Angular",
  ],
  mobile: [
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "SwiftUI",
    "Jetpack Compose",
    "Expo",
  ],
  devops: [
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "Terraform",
    "CI/CD",
    "Jenkins",
    "GitHub Actions",
  ],
  data_science: [
    "Python",
    "TensorFlow",
    "PyTorch",
    "Pandas",
    "NumPy",
    "SQL",
    "Spark",
    "R",
  ],
};

const DIFFICULTIES = [
  { id: "junior", label: "Junior", desc: "0-2 yıl deneyim" },
  { id: "intermediate", label: "Mid-Level", desc: "2-5 yıl deneyim" },
  { id: "senior", label: "Senior", desc: "5+ yıl deneyim" },
];

export default function InterviewPage() {
  const [step, setStep] = useState<"config" | "interview" | "completed">(
    "config",
  );
  const [field, setField] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("intermediate");

  const config = step !== "config" ? { field, techStack, difficulty } : null;
  const {
    isConnected,
    isCallActive,
    isSpeaking,
    transcript,
    currentQuestion,
    interviewId,
    overallScore,
    error,
    volumeLevel,
    startCall,
    endCall,
  } = useVapi(config);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    if (overallScore !== null) {
      setStep("completed");
    }
  }, [overallScore]);

  const handleStartInterview = () => {
    if (!field) return;
    setStep("interview");
    setTimeout(() => startCall(), 500);
  };

  const toggleTech = (tech: string) => {
    setTechStack((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );
  };

  const availableTech = TECH_OPTIONS[field] || [];

  // ============ CONFIG STEP ============
  if (step === "config") {
    return (
      <div className="interview-page">
        <div className="config-container">
          <div className="config-header">
            <h1>🎤 AI Mülakat Simülatörü</h1>
            <p>
              Mülakat tercihlerinizi belirleyin ve sesli mülakatınıza başlayın
            </p>
          </div>

          {/* Field Selection */}
          <div className="config-section">
            <h2>📋 Mülakat Alanı</h2>
            <div className="field-grid">
              {FIELDS.map((f) => (
                <button
                  key={f.id}
                  className={`field-card ${field === f.id ? "active" : ""}`}
                  onClick={() => {
                    setField(f.id);
                    setTechStack([]);
                  }}
                >
                  <span className="field-icon">{f.icon}</span>
                  <span className="field-label">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          {field && (
            <div className="config-section">
              <h2>🛠️ Teknoloji Stack</h2>
              <p className="hint">
                Mülakatta sorulmasını istediğiniz teknolojileri seçin
              </p>
              <div className="tech-grid">
                {availableTech.map((tech) => (
                  <button
                    key={tech}
                    className={`tech-tag ${techStack.includes(tech) ? "active" : ""}`}
                    onClick={() => toggleTech(tech)}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty */}
          {field && (
            <div className="config-section">
              <h2>📊 Zorluk Seviyesi</h2>
              <div className="difficulty-grid">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    className={`difficulty-card ${difficulty === d.id ? "active" : ""}`}
                    onClick={() => setDifficulty(d.id)}
                  >
                    <span className="diff-label">{d.label}</span>
                    <span className="diff-desc">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Button */}
          {field && (
            <button
              className="start-button"
              onClick={handleStartInterview}
              disabled={!field}
            >
              <span className="start-icon">🎙️</span>
              Mülakata Başla
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============ COMPLETED STEP ============
  if (step === "completed") {
    return (
      <div className="interview-page">
        <div className="completed-container">
          <div className="completed-header">
            <div className="score-circle">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" className="score-bg" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  className="score-fill"
                  style={{
                    strokeDasharray: `${((overallScore || 0) / 100) * 339.3} 339.3`,
                  }}
                />
              </svg>
              <span className="score-value">{overallScore || 0}</span>
            </div>
            <h1>Mülakat Tamamlandı!</h1>
            <p>Detaylı sonuçlarınız hazırlanıyor...</p>
          </div>

          <div className="completed-actions">
            {interviewId && (
              <a
                href={`/interview/${interviewId}`}
                className="view-results-btn"
              >
                📊 Detaylı Sonuçları Gör
              </a>
            )}
            <a href="/dashboard" className="dashboard-btn">
              📋 Dashboard&apos;a Git
            </a>
            <button
              className="retry-btn"
              onClick={() => {
                setStep("config");
                setField("");
                setTechStack([]);
              }}
            >
              🔄 Yeni Mülakat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ INTERVIEW STEP ============
  return (
    <div className="interview-page">
      <div className="interview-container">
        {/* Header */}
        <div className="interview-header">
          <div className="interview-info">
            <span className="field-badge">
              {FIELDS.find((f) => f.id === field)?.icon}{" "}
              {FIELDS.find((f) => f.id === field)?.label}
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

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="transcript-area">
            <h3>Konuşma Geçmişi</h3>
            <div className="transcript-list">
              {transcript.map((entry, i) => (
                <div key={i} className={`transcript-entry ${entry.role}`}>
                  <span className="role-icon">
                    {entry.role === "assistant" ? "🤖" : "👤"}
                  </span>
                  <p>{entry.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="interview-controls">
          {isCallActive ? (
            <button className="end-call-btn" onClick={endCall}>
              📞 Mülakatı Bitir
            </button>
          ) : (
            <button className="start-call-btn" onClick={startCall}>
              🎙️ Yeniden Bağlan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
