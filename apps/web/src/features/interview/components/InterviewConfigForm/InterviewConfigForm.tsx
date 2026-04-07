"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Mic,
  LogOut,
  Sparkles,
  MessageSquare,
  Code2,
  Server,
  Smartphone,
  Container,
  Database,
  Zap,
  ArrowRight,
  Check,
  Briefcase,
  Cpu,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FIELDS, TECH_OPTIONS, DIFFICULTIES } from "../../data/interviewConfig";

const FIELD_ICONS: Record<string, React.ReactNode> = {
  backend: <Server size={24} />,
  frontend: <Code2 size={24} />,
  fullstack: <Zap size={24} />,
  mobile: <Smartphone size={24} />,
  devops: <Container size={24} />,
  data_science: <Database size={24} />,
};

const FIELD_COLORS: Record<string, string> = {
  backend: "#818cf8",
  frontend: "#f472b6",
  fullstack: "#a78bfa",
  mobile: "#34d399",
  devops: "#fb923c",
  data_science: "#60a5fa",
};

const DIFFICULTY_ICONS: Record<string, React.ReactNode> = {
  junior: <GraduationCap size={20} />,
  intermediate: <Briefcase size={20} />,
  senior: <Cpu size={20} />,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  junior: "#4ade80",
  intermediate: "#facc15",
  senior: "#f87171",
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
  const { logout } = useAuth();
  const availableTech = TECH_OPTIONS[field] || [];

  const currentStep = !field ? 1 : availableTech.length > 0 && techStack.length === 0 ? 2 : 3;

  return (
    <>
      {/* Shared Top Nav */}
      <header className="dashboard-topnav">
        <Link href="/" className="topnav-logo">
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          <span className="logo-text">AI Coach</span>
        </Link>

        <nav className="topnav-nav">
          <Link href="/dashboard" className="nav-link">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          <Link href="/interview" className="nav-link active">
            <Mic size={16} />
            <span>Yeni Mulakat</span>
          </Link>
          <Link href="/questions" className="nav-link">
            <MessageSquare size={16} />
            <span>Sorular</span>
          </Link>
        </nav>

        <div className="topnav-actions">
          <button className="logout-btn" onClick={() => logout()}>
            <LogOut size={16} />
            <span>Cikis</span>
          </button>
        </div>
      </header>

      <div className="config-container">
        {/* Header */}
        <div className="config-header">
          <div className="config-header-icon">
            <Mic size={24} />
          </div>
          <h1>Mulakat Konfigurasyonu</h1>
          <p>Mulakat tercihlerinizi belirleyin ve sesli mulakatiniza baslayin</p>
        </div>

        {/* Steps indicator */}
        <div className="config-steps">
          <div className={`config-step ${currentStep >= 1 ? "active" : ""} ${field ? "completed" : ""}`}>
            <div className="step-number">{field ? <Check size={14} /> : "1"}</div>
            <span>Alan Secimi</span>
          </div>
          <div className="step-line" />
          <div className={`config-step ${currentStep >= 2 ? "active" : ""} ${techStack.length > 0 ? "completed" : ""}`}>
            <div className="step-number">{techStack.length > 0 ? <Check size={14} /> : "2"}</div>
            <span>Teknoloji</span>
          </div>
          <div className="step-line" />
          <div className={`config-step ${currentStep >= 3 ? "active" : ""}`}>
            <div className="step-number">3</div>
            <span>Zorluk</span>
          </div>
        </div>

        {/* Field Selection */}
        <div className="config-section">
          <div className="section-header">
            <h2>Mulakat Alani</h2>
            <span className="section-hint">Mulakat yapmak istediginiz alani secin</span>
          </div>
          <div className="field-grid">
            {FIELDS.map((f) => (
              <button
                key={f.id}
                className={`field-card ${field === f.id ? "active" : ""}`}
                onClick={() => onFieldChange(f.id)}
                style={{
                  "--field-color": FIELD_COLORS[f.id] || "#a78bfa",
                } as React.CSSProperties}
              >
                <span className="field-icon">{FIELD_ICONS[f.id] || f.icon}</span>
                <span className="field-label">{f.label}</span>
                {field === f.id && (
                  <span className="field-check">
                    <Check size={14} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        {field && (
          <div className="config-section animate-in">
            <div className="section-header">
              <h2>Teknoloji Stack</h2>
              <span className="section-hint">
                Sorulmasini istediginiz teknolojileri secin
                {techStack.length > 0 && (
                  <span className="tech-count">{techStack.length} secili</span>
                )}
              </span>
            </div>
            <div className="tech-grid">
              {availableTech.map((tech) => (
                <button
                  key={tech}
                  className={`tech-tag ${techStack.includes(tech) ? "active" : ""}`}
                  onClick={() => onTechToggle(tech)}
                >
                  {techStack.includes(tech) && <Check size={13} />}
                  {tech}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty */}
        {field && (
          <div className="config-section animate-in">
            <div className="section-header">
              <h2>Zorluk Seviyesi</h2>
            </div>
            <div className="difficulty-grid">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={`difficulty-card ${difficulty === d.id ? "active" : ""}`}
                  onClick={() => onDifficultyChange(d.id)}
                  style={{
                    "--diff-color": DIFFICULTY_COLORS[d.id] || "#a78bfa",
                  } as React.CSSProperties}
                >
                  <span className="diff-icon">{DIFFICULTY_ICONS[d.id]}</span>
                  <span className="diff-label">{d.label}</span>
                  <span className="diff-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        {field && (
          <button className="start-button animate-in" onClick={onStart} disabled={!field}>
            <Mic size={20} />
            Mulakata Basla
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </>
  );
}
