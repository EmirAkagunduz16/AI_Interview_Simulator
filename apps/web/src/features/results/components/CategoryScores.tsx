"use client";

import { Monitor, MessageCircle, BookOpen, Shield } from "lucide-react";
import type { InterviewReport } from "../types";

const CATEGORY_CONFIG = [
  {
    key: "technicalScore" as const,
    label: "Teknik Bilgi",
    desc: "Teknik kavram hakimiyeti ve doğruluğu",
    color: "#60a5fa",
    gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)",
    icon: <Monitor size={18} />,
  },
  {
    key: "communicationScore" as const,
    label: "İletişim",
    desc: "Düşünceleri açık ve yapılandırılmış ifade etme",
    color: "#4ade80",
    gradient: "linear-gradient(135deg, #4ade80, #22c55e)",
    icon: <MessageCircle size={18} />,
  },
  {
    key: "dictionScore" as const,
    label: "Diksiyon",
    desc: "Kelime seçimi, akıcılık ve profesyonel dil",
    color: "#f472b6",
    gradient: "linear-gradient(135deg, #f472b6, #ec4899)",
    icon: <BookOpen size={18} />,
  },
  {
    key: "confidenceScore" as const,
    label: "Özgüven",
    desc: "Kendine güven, net tutum ve kararlılık",
    color: "#facc15",
    gradient: "linear-gradient(135deg, #facc15, #eab308)",
    icon: <Shield size={18} />,
  },
];

interface CategoryScoresProps {
  report: InterviewReport;
}

export default function CategoryScores({ report }: CategoryScoresProps) {
  return (
    <div className="categories-grid">
      {CATEGORY_CONFIG.map((cat) => {
        const score = report[cat.key] ?? 0;
        const level =
          score >= 80 ? "Yüksek" : score >= 60 ? "İyi" : score >= 40 ? "Orta" : "Düşük";
        return (
          <div key={cat.key} className="category-card">
            <div className="cat-header">
              <span className="cat-icon" style={{ color: cat.color }}>
                {cat.icon}
              </span>
              <div className="cat-meta">
                <span className="cat-label">{cat.label}</span>
                <span className="cat-desc">{cat.desc}</span>
              </div>
            </div>
            <div className="cat-bar-wrapper">
              <div
                className="cat-bar-fill"
                style={{
                  width: `${score}%`,
                  background: cat.gradient,
                }}
              />
            </div>
            <div className="cat-footer">
              <span className="cat-score" style={{ color: cat.color }}>
                {score}/100
              </span>
              <span className="cat-level">{level}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
