"use client";

import { FIELD_LABELS } from "../data/fieldLabels";
import type { InterviewListItem } from "../types";

interface InterviewHistoryListProps {
  interviews: InterviewListItem[];
}

export default function InterviewHistoryList({
  interviews,
}: InterviewHistoryListProps) {
  if (interviews.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🎯</span>
        <p>Henüz mülakat yapmadınız</p>
        <a href="/interview" className="empty-cta">
          İlk mülakatınızı başlatın →
        </a>
      </div>
    );
  }

  return (
    <div className="interview-list">
      {interviews.map((interview) => {
        const fieldInfo = FIELD_LABELS[interview.field] || {
          label: interview.field,
          icon: "📋",
        };

        return (
          <a
            key={interview.id}
            href={`/interview/${interview.id}`}
            className="interview-card"
          >
            <div className="card-left">
              <span className="card-icon">{fieldInfo.icon}</span>
              <div className="card-info">
                <span className="card-field">{fieldInfo.label}</span>
                <span className="card-tech">
                  {interview.techStack.join(", ")}
                </span>
                <span className="card-date">
                  {new Date(interview.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
            </div>
            <div className="card-right">
              {interview.status === "completed" && interview.score != null ? (
                <span className="card-score">{interview.score}</span>
              ) : (
                <span className={`card-status ${interview.status}`}>
                  {interview.status === "in_progress"
                    ? "Devam Ediyor"
                    : "Beklemede"}
                </span>
              )}
              <span className="card-arrow">→</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
