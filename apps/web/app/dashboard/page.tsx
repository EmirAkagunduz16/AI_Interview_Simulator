"use client";

import { useState, useEffect, useCallback } from "react";
import "./dashboard.scss";

interface Interview {
  id: string;
  field: string;
  techStack: string[];
  status: string;
  totalScore?: number;
  report?: {
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    dictionScore: number;
    confidenceScore: number;
    summary?: string;
  };
  createdAt: string;
  completedAt?: string;
}

interface Stats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAnswered: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_INTERVIEW_SERVICE_URL ||
  "http://localhost:3005/api/v1";
const USER_ID = "anonymous";

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [interviewsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/interviews`, {
          headers: { "x-user-id": USER_ID },
        }),
        fetch(`${API_BASE}/interviews/stats`, {
          headers: { "x-user-id": USER_ID },
        }),
      ]);

      if (interviewsRes.ok) {
        const data = await interviewsRes.json();
        setInterviews(data.interviews || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#34d399";
    if (score >= 60) return "#fbbf24";
    return "#f87171";
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      backend: "Backend",
      frontend: "Frontend",
      fullstack: "Fullstack",
      mobile: "Mobile",
      devops: "DevOps",
      data_science: "Data Science",
    };
    return labels[field] || field;
  };

  const getFieldIcon = (field: string): string => {
    const icons: Record<string, string> = {
      backend: "🖥️",
      frontend: "🎨",
      fullstack: "⚡",
      mobile: "📱",
      devops: "🔧",
      data_science: "📊",
    };
    return icons[field] || "📋";
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-state">
          <div className="loader" />
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>📊 Dashboard</h1>
          <a href="/interview" className="new-interview-btn">
            🎤 Yeni Mülakat
          </a>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <span className="stat-value">{stats?.totalInterviews || 0}</span>
            <span className="stat-label">Toplam Mülakat</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <span className="stat-value">
              {stats?.completedInterviews || 0}
            </span>
            <span className="stat-label">Tamamlanan</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📈</span>
            <span className="stat-value">
              {Math.round(stats?.averageScore || 0)}
            </span>
            <span className="stat-label">Ortalama Puan</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🏆</span>
            <span className="stat-value">
              {Math.round(stats?.bestScore || 0)}
            </span>
            <span className="stat-label">En İyi Puan</span>
          </div>
        </div>

        {/* Interview History */}
        <div className="history-section">
          <h2>Mülakat Geçmişi</h2>

          {interviews.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎙️</span>
              <p>Henüz bir mülakat yapmadınız.</p>
              <a href="/interview" className="empty-cta">
                İlk Mülakatınıza Başlayın →
              </a>
            </div>
          ) : (
            <div className="interview-list">
              {interviews.map((interview) => {
                const score =
                  interview.report?.overallScore || interview.totalScore || 0;
                return (
                  <a
                    key={interview.id}
                    href={`/interview/${interview.id}`}
                    className="interview-card"
                  >
                    <div className="card-left">
                      <span className="card-icon">
                        {getFieldIcon(interview.field)}
                      </span>
                      <div className="card-info">
                        <span className="card-field">
                          {getFieldLabel(interview.field)}
                        </span>
                        <span className="card-tech">
                          {interview.techStack?.join(" • ") || "General"}
                        </span>
                        <span className="card-date">
                          {new Date(interview.createdAt).toLocaleDateString(
                            "tr-TR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="card-right">
                      {interview.status === "completed" ? (
                        <span
                          className="card-score"
                          style={{ color: getScoreColor(score) }}
                        >
                          {score}
                        </span>
                      ) : (
                        <span className={`card-status ${interview.status}`}>
                          {interview.status === "in_progress"
                            ? "Devam Ediyor"
                            : "Bekliyor"}
                        </span>
                      )}
                      <span className="card-arrow">→</span>
                    </div>
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
