"use client";

import React, { useEffect, useState } from "react";
import { supabase, Interview, InterviewReport } from "../../src/lib/supabase";
import "./dashboard.scss";

type InterviewWithReport = Interview & {
  interview_reports?: Pick<
    InterviewReport,
    "overall_score" | "technical_score" | "communication_score"
  >[];
};

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<InterviewWithReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    avgScore: 0,
    bestScore: 0,
  });

  useEffect(() => {
    loadInterviews();
  }, []);

  async function loadInterviews() {
    try {
      const { data, error } = await supabase
        .from("interviews")
        .select(
          "*, interview_reports(overall_score, technical_score, communication_score)",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const interviewList = (data || []) as InterviewWithReport[];
      setInterviews(interviewList);

      // Calculate stats
      const completed = interviewList.filter((i) => i.status === "completed");
      const scores = completed
        .map((i) => i.interview_reports?.[0]?.overall_score)
        .filter((s): s is number => s !== undefined);

      setStats({
        total: interviewList.length,
        completed: completed.length,
        avgScore:
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0,
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      });
    } catch (error) {
      console.error("Failed to load interviews:", error);
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "score--excellent";
    if (score >= 60) return "score--good";
    if (score >= 40) return "score--average";
    return "score--low";
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "preparing":
        return "Hazırlanıyor";
      case "in_progress":
        return "Devam Ediyor";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  }

  function getFieldLabel(field: string): string {
    const fields: Record<string, string> = {
      backend: "Backend",
      frontend: "Frontend",
      fullstack: "Full Stack",
      mobile: "Mobil",
      devops: "DevOps",
    };
    return fields[field] || field;
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        {/* Header */}
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__subtitle">
              Mülakat performansını takip et ve kendini geliştir
            </p>
          </div>
          <a href="/interview" className="dashboard__new-btn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            Yeni Mülakat
          </a>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--purple">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="stat-card__value">{stats.total}</div>
            <div className="stat-card__label">Toplam Mülakat</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--green">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="stat-card__value">{stats.completed}</div>
            <div className="stat-card__label">Tamamlanan</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--blue">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="stat-card__value">
              {stats.avgScore}
              <span className="stat-card__unit">%</span>
            </div>
            <div className="stat-card__label">Ortalama Puan</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--gold">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="stat-card__value">
              {stats.bestScore}
              <span className="stat-card__unit">%</span>
            </div>
            <div className="stat-card__label">En İyi Puan</div>
          </div>
        </div>

        {/* Interview History */}
        <div className="interview-history">
          <h2 className="interview-history__title">Geçmiş Mülakatlar</h2>

          {loading ? (
            <div className="interview-history__loading">
              <div className="spinner" />
              <p>Yükleniyor...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="interview-history__empty">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
              <h3>Henüz mülakat yok</h3>
              <p>İlk mülakatınızı başlatarak yapay zeka ile pratiğe başlayın</p>
              <a href="/interview" className="dashboard__new-btn">
                Mülakata Başla
              </a>
            </div>
          ) : (
            <div className="interview-list">
              {interviews.map((interview) => {
                const report = interview.interview_reports?.[0];
                const score = report?.overall_score;

                return (
                  <a
                    key={interview.id}
                    href={`/interview/${interview.id}`}
                    className="interview-card"
                  >
                    <div className="interview-card__left">
                      <div className="interview-card__field-badge">
                        {getFieldLabel(interview.field)}
                      </div>
                      <div className="interview-card__meta">
                        <span
                          className={`interview-card__status interview-card__status--${interview.status}`}
                        >
                          {getStatusLabel(interview.status)}
                        </span>
                        <span className="interview-card__date">
                          {formatDate(interview.created_at)}
                        </span>
                      </div>
                      {interview.tech_stack &&
                        interview.tech_stack.length > 0 && (
                          <div className="interview-card__tags">
                            {interview.tech_stack.slice(0, 4).map((tech) => (
                              <span key={tech} className="interview-card__tag">
                                {tech}
                              </span>
                            ))}
                            {interview.tech_stack.length > 4 && (
                              <span className="interview-card__tag">
                                +{interview.tech_stack.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                    </div>

                    {score !== undefined && (
                      <div
                        className={`interview-card__score ${getScoreColor(score)}`}
                      >
                        <span className="interview-card__score-value">
                          {score}
                        </span>
                        <span className="interview-card__score-label">
                          puan
                        </span>
                      </div>
                    )}

                    <svg
                      className="interview-card__arrow"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
