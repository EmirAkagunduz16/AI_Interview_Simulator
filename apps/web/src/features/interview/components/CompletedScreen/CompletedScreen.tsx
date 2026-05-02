"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  LayoutDashboard,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";

interface CompletedScreenProps {
  overallScore: number | null;
  interviewId: string | null;
  onRetry: () => void;
}

interface InterviewSnapshot {
  status: string;
  report?: {
    overallScore: number;
    summary: string;
  };
}

const EVALUATING_PLACEHOLDER = "Değerlendirme hazırlanıyor...";

export default function CompletedScreen({
  overallScore,
  interviewId,
  onRetry,
}: CompletedScreenProps) {
  // Poll the interview every 3s while the evaluation is still being prepared.
  // The webhook returns immediately with status=completed but the report is
  // generated asynchronously by Gemini. Without polling, the user sees a
  // permanent score of 0 even though the actual evaluation arrives a moment
  // later.
  const { data: liveInterview } = useQuery<InterviewSnapshot>({
    queryKey: ["interview-completion-poll", interviewId],
    queryFn: async () => {
      const res = await api.get(`/interviews/${interviewId}`);
      return res.data;
    },
    enabled: !!interviewId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const report = data?.report;
      // Stop polling once we have a real (post-eval) report
      if (
        report &&
        report.summary !== EVALUATING_PLACEHOLDER &&
        (report.overallScore > 0 || report.summary?.length > 0)
      ) {
        return false;
      }
      return 3000;
    },
    refetchIntervalInBackground: true,
  });

  const liveScore = liveInterview?.report?.overallScore;
  const isStillEvaluating =
    !liveInterview?.report ||
    liveInterview.report.summary === EVALUATING_PLACEHOLDER;

  // Prefer the live score from the poll over the (often-stale) prop.
  const effectiveScore =
    typeof liveScore === "number" && liveScore > 0
      ? liveScore
      : (overallScore ?? 0);

  const score = effectiveScore || 0;
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
            {isStillEvaluating ? (
              <Loader2
                size={28}
                className="loader-icon"
                style={{ color: "#a78bfa" }}
              />
            ) : (
              score
            )}
          </span>
        </div>

        <div className="completed-badge">
          <CheckCircle2 size={20} />
        </div>

        <h1>Mülakat Tamamlandı!</h1>
        <p>
          {isStillEvaluating
            ? "Yapay zeka mülakatınızı değerlendiriyor, birkaç saniye sürebilir..."
            : "Genel puanınız hazır. Detayları aşağıdan inceleyebilirsiniz."}
        </p>
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
