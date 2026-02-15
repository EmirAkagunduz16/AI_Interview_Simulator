"use client";

import { useQuery } from "@tanstack/react-query";
import { AuthGuard } from "@/features/auth/components";
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
      return res.data.interviews || res.data || [];
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
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <a href="/interview" className="new-interview-btn">
            + Yeni Mülakat
          </a>
        </div>

        {stats && <StatsGrid stats={stats} />}

        <div className="history-section">
          <h2>Mülakat Geçmişi</h2>
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
