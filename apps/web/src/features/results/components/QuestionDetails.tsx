"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, TrendingUp } from "lucide-react";
import type { QuestionEvaluation } from "../types";

interface QuestionDetailsProps {
  evaluations: QuestionEvaluation[];
}

export default function QuestionDetails({ evaluations }: QuestionDetailsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggle = (i: number) => {
    setExpandedIdx((prev) => (prev === i ? null : i));
  };

  return (
    <div className="questions-list">
      {evaluations.map((q, i) => {
        const strengths = q.strengths ?? [];
        const improvements = q.improvements ?? [];
        const isOpen = expandedIdx === i;
        const scoreColor =
          q.score >= 80
            ? "#34d399"
            : q.score >= 60
              ? "#fbbf24"
              : q.score >= 40
                ? "#f97316"
                : "#f87171";

        return (
          <div
            key={i}
            className={`question-detail-card ${isOpen ? "expanded" : ""}`}
          >
            {/* Clickable Header */}
            <button className="qd-header" onClick={() => toggle(i)}>
              <div className="qd-header-left">
                <span className="qd-number">Soru {i + 1}</span>
                <span className="qd-question-preview">
                  {q.question.length > 80
                    ? q.question.slice(0, 80) + "…"
                    : q.question}
                </span>
              </div>
              <div className="qd-header-right">
                <span
                  className="qd-score-badge"
                  style={{
                    background: `${scoreColor}18`,
                    color: scoreColor,
                    borderColor: `${scoreColor}33`,
                  }}
                >
                  {q.score}/100
                </span>
                <ChevronDown
                  size={18}
                  className={`qd-chevron ${isOpen ? "rotated" : ""}`}
                />
              </div>
            </button>

            {/* Expandable Body */}
            <div className={`qd-body ${isOpen ? "open" : ""}`}>
              <div className="qd-section">
                <p className="qd-full-question">{q.question}</p>
              </div>

              <div className="qd-section qd-answer-section">
                <span className="qd-label">Cevabınız</span>
                <p className="qd-answer-text">{q.answer || "—"}</p>
              </div>

              <div className="qd-section qd-feedback-section">
                <span className="qd-label">AI Değerlendirmesi</span>
                <p className="qd-feedback-text">{q.feedback}</p>
              </div>

              <div className="qd-two-cols">
                {strengths.length > 0 && (
                  <div className="qd-col qd-strengths-col">
                    <span className="qd-label">
                      <CheckCircle2 size={14} /> Güçlü Yönler
                    </span>
                    <ul>
                      {strengths.map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {improvements.length > 0 && (
                  <div className="qd-col qd-improvements-col">
                    <span className="qd-label">
                      <TrendingUp size={14} /> Geliştirilebilir
                    </span>
                    <ul>
                      {improvements.map((imp, j) => (
                        <li key={j}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
