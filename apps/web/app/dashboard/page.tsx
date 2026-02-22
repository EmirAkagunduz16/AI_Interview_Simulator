"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AuthGuard } from "@/features/auth/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  StatsGrid,
  InterviewHistoryList,
} from "@/features/dashboard/components";
import type {
  InterviewStats,
  InterviewListItem,
} from "@/features/dashboard/types";
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
      // Mülakat yoksa API { total: 0, page: 1 } dönebiliyor, array kontrolü şart
      if (Array.isArray(res.data)) return res.data;
      return res.data?.interviews || res.data?.items || [];
    },
  });

  const loading = statsLoading || interviewsLoading;

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
      <header className="dashboard-topnav">
        <div
          className="topnav-logo"
          onClick={() => (window.location.href = "/")}
        >
          <div className="logo-icon">✨</div>
          <span className="logo-text">AI Coach</span>
        </div>
        <div className="topnav-actions">
          <button className="logout-btn" onClick={() => logout()}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        <div className="dashboard-greeting">
          <h1>Hoş Geldiniz</h1>
          <p>Mülakat performansınızı takip edin ve hedeflerinize ulaşın.</p>
        </div>

        <div className="dashboard-actions">
          <Link href="/interview" className="btn-primary">
            <span className="icon">🚀</span> Yeni Mülakat Başlat
          </Link>
        </div>

        {stats && <StatsGrid stats={stats} />}

        <div className="history-section">
          <div className="section-header">
            <h2>Son Mülakatlar</h2>
          </div>
          <InterviewHistoryList interviews={interviews || []} />
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
