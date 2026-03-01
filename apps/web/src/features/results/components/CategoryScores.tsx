"use client";

import { Monitor, MessageCircle, BookOpen, Shield } from "lucide-react";
import type { InterviewReport } from "../types";

const CATEGORY_CONFIG = [
  {
    key: "technicalScore" as const,
    label: "Teknik Bilgi",
    color: "#60a5fa",
    icon: <Monitor size={16} />,
  },
  {
    key: "communicationScore" as const,
    label: "İletişim",
    color: "#4ade80",
    icon: <MessageCircle size={16} />,
  },
  {
    key: "dictionScore" as const,
    label: "Diksiyon",
    color: "#f472b6",
    icon: <BookOpen size={16} />,
  },
  {
    key: "confidenceScore" as const,
    label: "Özgüven",
    color: "#facc15",
    icon: <Shield size={16} />,
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
        return (
          <div key={cat.key} className="category-card">
            <div className="cat-header">
              <span className="cat-icon" style={{ color: cat.color }}>
                {cat.icon}
              </span>
              <span className="cat-label">{cat.label}</span>
            </div>
            <div className="cat-bar-wrapper">
              <div
                className="cat-bar-fill"
                style={{
                  width: `${score}%`,
                  background: cat.color,
                }}
              />
            </div>
            <span className="cat-score" style={{ color: cat.color }}>
              {score}/100
            </span>
          </div>
        );
      })}
    </div>
  );
}
