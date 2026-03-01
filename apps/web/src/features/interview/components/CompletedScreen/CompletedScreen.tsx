"use client";

import Link from "next/link";
import {
  BarChart3,
  LayoutDashboard,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface CompletedScreenProps {
  overallScore: number | null;
  interviewId: string | null;
  onRetry: () => void;
}

export default function CompletedScreen({
  overallScore,
  interviewId,
  onRetry,
}: CompletedScreenProps) {
  const score = overallScore || 0;
  const circumference = 2 * Math.PI * 54;
  const dashArray = (score / 100) * circumference;
  const gaugeColor =
    score >= 80
      ? "#4ade80"
      : score >= 60
        ? "#facc15"
        : score > 0
          ? "#f87171"
          : "#6366f1";

  return (
    <div className="completed-container">
      <div className="completed-header">
        <div className="score-circle">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" className="score-bg" />
            <circle
              cx="60"
              cy="60"
              r="54"
              className="score-fill"
              style={{
                strokeDasharray: `${dashArray} ${circumference}`,
                stroke: gaugeColor,
              }}
            />
          </svg>
          <span className="score-value" style={{ color: gaugeColor }}>
            {score}
          </span>
        </div>

        <div className="completed-badge">
          <CheckCircle2 size={20} />
        </div>

        <h1>Mülakat Tamamlandı!</h1>
        <p>Detaylı sonuçlarınız hazırlanıyor...</p>
      </div>

      <div className="completed-actions">
        {interviewId && (
          <Link href={`/interview/${interviewId}`} className="view-results-btn">
            <BarChart3 size={18} />
            Detaylı Sonuçları Gör
          </Link>
        )}
        <Link href="/dashboard" className="dashboard-btn">
          <LayoutDashboard size={18} />
          Dashboard&apos;a Git
        </Link>
        <button className="retry-btn" onClick={onRetry}>
          <RefreshCw size={16} />
          Yeni Mülakat
        </button>
      </div>
    </div>
  );
}
