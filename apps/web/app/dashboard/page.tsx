"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Mic,
  LogOut,
  Sparkles,
  FileText,
  CheckCircle2,
  BarChart3,
  Trophy,
  ArrowRight,
  Clock,
  Target,
} from "lucide-react";
import { AuthGuard } from "@/features/auth/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type {
  InterviewStats,
  InterviewListItem,
} from "@/features/dashboard/types";
import { FIELD_LABELS } from "@/features/dashboard/data/fieldLabels";
import api from "@/lib/axios";
import "./dashboard.scss";

function DashboardContent() {
  const { logout } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<InterviewStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await api.get("/interviews/stats");
      return res.data;
    },
  });

  const { data: interviews, isLoading: interviewsLoading } = useQuery<
    InterviewListItem[]
  >({
    queryKey: ["dashboard", "interviews"],
    queryFn: async () => {
      const res = await api.get("/interviews?limit=20");
      if (Array.isArray(res.data)) return res.data;
      return res.data?.interviews || res.data?.items || [];
    },
  });

  const loading = statsLoading || interviewsLoading;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Tamamlandı", className: "status-completed" };
      case "in_progress":
        return { label: "Devam Ediyor", className: "status-progress" };
      default:
        return { label: "Beklemede", className: "status-pending" };
    }
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
      {/* Top Nav */}
      <header className="dashboard-topnav">
        <Link href="/" className="topnav-logo">
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          <span className="logo-text">AI Coach</span>
        </Link>

        <nav className="topnav-nav">
          <Link href="/dashboard" className="nav-link active">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          <Link href="/interview" className="nav-link">
            <Mic size={16} />
            <span>Yeni Mülakat</span>
          </Link>
        </nav>

        <div className="topnav-actions">
          <button className="logout-btn" onClick={() => logout()}>
            <LogOut size={16} />
            <span>Çıkış</span>
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Greeting */}
        <div className="dashboard-greeting">
          <h1>Hoş Geldiniz</h1>
          <p>Mülakat performansınızı takip edin ve hedeflerinize ulaşın.</p>
        </div>

        {/* Quick Action */}
        <Link href="/interview" className="new-interview-btn">
          <Mic size={20} />
          <span>Yeni Mülakat Başlat</span>
          <ArrowRight size={18} />
        </Link>

        {/* Stats Grid */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div
                className="stat-icon-wrap"
                style={{
                  background: "rgba(99, 102, 241, 0.12)",
                  color: "#818cf8",
                }}
              >
                <FileText size={20} />
              </div>
              <span className="stat-value">{stats.totalInterviews}</span>
              <span className="stat-label">Toplam Mülakat</span>
            </div>
            <div className="stat-card">
              <div
                className="stat-icon-wrap"
                style={{
                  background: "rgba(34, 197, 94, 0.12)",
                  color: "#4ade80",
                }}
              >
                <CheckCircle2 size={20} />
              </div>
              <span className="stat-value">{stats.completedInterviews}</span>
              <span className="stat-label">Tamamlanan</span>
            </div>
            <div className="stat-card">
              <div
                className="stat-icon-wrap"
                style={{
                  background: "rgba(59, 130, 246, 0.12)",
                  color: "#60a5fa",
                }}
              >
                <BarChart3 size={20} />
              </div>
              <span className="stat-value">
                {stats.averageScore ? Math.round(stats.averageScore) : "—"}
              </span>
              <span className="stat-label">Ortalama Puan</span>
            </div>
            <div className="stat-card">
              <div
                className="stat-icon-wrap"
                style={{
                  background: "rgba(234, 179, 8, 0.12)",
                  color: "#facc15",
                }}
              >
                <Trophy size={20} />
              </div>
              <span className="stat-value">{stats.bestScore || "—"}</span>
              <span className="stat-label">En Yüksek</span>
            </div>
          </div>
        )}

        {/* Interview History */}
        <div className="history-section">
          <div className="section-header">
            <h2>Son Mülakatlar</h2>
          </div>

          {!interviews || interviews.length === 0 ? (
            <div className="empty-state">
              <Target size={40} strokeWidth={1.5} />
              <p>Henüz mülakat yapmadınız</p>
              <Link href="/interview" className="empty-cta">
                İlk mülakatınızı başlatın
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="interview-list">
              {interviews.map((interview) => {
                const fieldInfo = FIELD_LABELS[interview.field] || {
                  label: interview.field,
                  icon: "📋",
                };
                const statusInfo = getStatusInfo(interview.status);

                return (
                  <Link
                    key={interview.id}
                    href={`/interview/${interview.id}`}
                    className="interview-card"
                  >
                    <div className="card-left">
                      <span className="card-icon">{fieldInfo.icon}</span>
                      <div className="card-info">
                        <span className="card-field">{fieldInfo.label}</span>
                        <span className="card-tech">
                          {interview.techStack?.join(", ") || "—"}
                        </span>
                        <span className="card-date">
                          <Clock size={12} />
                          {new Date(interview.createdAt).toLocaleDateString(
                            "tr-TR",
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="card-right">
                      {interview.status === "completed" &&
                      interview.score != null ? (
                        <span
                          className="card-score"
                          style={{
                            color:
                              interview.score >= 80
                                ? "#4ade80"
                                : interview.score >= 60
                                  ? "#facc15"
                                  : "#f87171",
                          }}
                        >
                          {interview.score}
                        </span>
                      ) : null}
                      <span className={`card-status ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                      <ArrowRight size={16} className="card-arrow" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
