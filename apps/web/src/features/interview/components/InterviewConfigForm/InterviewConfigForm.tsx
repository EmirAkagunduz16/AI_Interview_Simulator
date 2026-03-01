"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  Code2,
  Server,
  Smartphone,
  Container,
  Database,
  Zap,
} from "lucide-react";
import { FIELDS, TECH_OPTIONS, DIFFICULTIES } from "../../data/interviewConfig";

const FIELD_ICONS: Record<string, React.ReactNode> = {
  backend: <Server size={22} />,
  frontend: <Code2 size={22} />,
  fullstack: <Zap size={22} />,
  mobile: <Smartphone size={22} />,
  devops: <Container size={22} />,
  data_science: <Database size={22} />,
};

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
      <div className="config-back">
        <Link href="/dashboard" className="back-link">
          <ArrowLeft size={18} />
          <span>Dashboard&apos;a Dön</span>
        </Link>
      </div>

      <div className="config-header">
        <h1>
          <Mic size={28} />
          AI Mülakat Simülatörü
        </h1>
        <p>Mülakat tercihlerinizi belirleyin ve sesli mülakatınıza başlayın</p>
      </div>

      {/* Field Selection */}
      <div className="config-section">
        <h2>Mülakat Alanı</h2>
        <div className="field-grid">
          {FIELDS.map((f) => (
            <button
              key={f.id}
              className={`field-card ${field === f.id ? "active" : ""}`}
              onClick={() => onFieldChange(f.id)}
            >
              <span className="field-icon">{FIELD_ICONS[f.id] || f.icon}</span>
              <span className="field-label">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      {field && (
        <div className="config-section">
          <h2>Teknoloji Stack</h2>
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
          <h2>Zorluk Seviyesi</h2>
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
          <Mic size={20} />
          Mülakata Başla
        </button>
      )}
    </div>
  );
}
