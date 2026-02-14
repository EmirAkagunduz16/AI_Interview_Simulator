"use client";

import type { QuestionEvaluation } from "../types";

interface QuestionDetailsProps {
  evaluations: QuestionEvaluation[];
}

export default function QuestionDetails({ evaluations }: QuestionDetailsProps) {
  return (
    <div className="questions-list">
      {evaluations.map((q, i) => {
        const scoreColor =
          q.score >= 80 ? "#34d399" : q.score >= 60 ? "#fbbf24" : "#f87171";

        return (
          <div key={i} className="question-detail-card">
            <div className="qd-header">
              <span className="qd-number">Soru {i + 1}</span>
              <span className="qd-score" style={{ color: scoreColor }}>
                {q.score}/100
              </span>
            </div>

            <p className="qd-question">{q.question}</p>

            <div className="qd-answer">
              <span className="qd-label">Cevabınız</span>
              <p>{q.answer || "—"}</p>
            </div>

            <div className="qd-feedback">
              <span className="qd-label">Değerlendirme</span>
              <p>{q.feedback}</p>
            </div>

            {q.strengths.length > 0 && (
              <div className="qd-strengths">
                <span className="qd-label">Güçlü Yönler</span>
                <ul>
                  {q.strengths.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {q.improvements.length > 0 && (
              <div className="qd-improvements">
                <span className="qd-label">Geliştirilebilir Alanlar</span>
                <ul>
                  {q.improvements.map((imp, j) => (
                    <li key={j}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
