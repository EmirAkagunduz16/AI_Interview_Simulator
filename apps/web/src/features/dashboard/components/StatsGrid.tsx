"use client";

import type { InterviewStats } from "../types";

interface StatsGridProps {
  stats: InterviewStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-icon">📝</span>
        <span className="stat-value">{stats.totalInterviews}</span>
        <span className="stat-label">Toplam Mülakat</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">✅</span>
        <span className="stat-value">{stats.completedInterviews}</span>
        <span className="stat-label">Tamamlanan</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📊</span>
        <span className="stat-value">{stats.averageScore || "—"}</span>
        <span className="stat-label">Ortalama Puan</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">🏆</span>
        <span className="stat-value">{stats.bestScore || "—"}</span>
        <span className="stat-label">En Yüksek</span>
      </div>
    </div>
  );
}
