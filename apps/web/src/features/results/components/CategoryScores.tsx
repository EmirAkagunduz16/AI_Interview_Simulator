"use client";

import { SCORE_CATEGORIES, type InterviewReport } from "../types";

interface CategoryScoresProps {
  report: InterviewReport;
}

export default function CategoryScores({ report }: CategoryScoresProps) {
  return (
    <div className="categories-grid">
      {SCORE_CATEGORIES.map((cat) => {
        const score = report[cat.key] ?? 0;
        return (
          <div key={cat.key} className="category-card">
            <div className="cat-header">
              <span className="cat-icon">{cat.icon}</span>
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
