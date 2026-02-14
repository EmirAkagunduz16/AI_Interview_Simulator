"use client";

import { FIELDS, TECH_OPTIONS, DIFFICULTIES } from "../../data/interviewConfig";

interface InterviewConfigFormProps {
  field: string;
  techStack: string[];
  difficulty: string;
  onFieldChange: (field: string) => void;
  onTechToggle: (tech: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onStart: () => void;
}

export default function InterviewConfigForm({
  field,
  techStack,
  difficulty,
  onFieldChange,
  onTechToggle,
  onDifficultyChange,
  onStart,
}: InterviewConfigFormProps) {
  const availableTech = TECH_OPTIONS[field] || [];

  return (
    <div className="config-container">
      <div className="config-header">
        <h1>🎤 AI Mülakat Simülatörü</h1>
        <p>Mülakat tercihlerinizi belirleyin ve sesli mülakatınıza başlayın</p>
      </div>

      {/* Field Selection */}
      <div className="config-section">
        <h2>📋 Mülakat Alanı</h2>
        <div className="field-grid">
          {FIELDS.map((f) => (
            <button
              key={f.id}
              className={`field-card ${field === f.id ? "active" : ""}`}
              onClick={() => onFieldChange(f.id)}
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
                onClick={() => onTechToggle(tech)}
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
                onClick={() => onDifficultyChange(d.id)}
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
        <button className="start-button" onClick={onStart} disabled={!field}>
          <span className="start-icon">🎙️</span>
          Mülakata Başla
        </button>
      )}
    </div>
  );
}
