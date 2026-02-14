"use client";

import { useState, useEffect, useCallback } from "react";
import {
  StatsGrid,
  InterviewHistoryList,
} from "@/features/dashboard/components";
import type {
  InterviewStats,
  InterviewListItem,
} from "@/features/dashboard/types";
import "./dashboard.scss";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DashboardPage() {
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const headers = { "x-user-id": "demo-user" };
      const [statsRes, interviewsRes] = await Promise.all([
        fetch(`${API_BASE}/interviews/stats`, { headers }),
        fetch(`${API_BASE}/interviews?limit=20`, { headers }),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (interviewsRes.ok) {
        const data = await interviewsRes.json();
        setInterviews(data.interviews || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <InterviewHistoryList interviews={interviews} />
        </div>
      </div>
    </div>
  );
}
