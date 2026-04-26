"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mic,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Lightbulb,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  ScoreGauge,
  CategoryScores,
  QuestionDetails,
  ChatHistory,
} from "@/features/results/components";
import type { InterviewResult } from "@/features/results/types";
import { getDifficultyDisplay } from "@/features/dashboard/data/difficultyLabels";
import api from "@/lib/axios";
import "./results.scss";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useQuery<InterviewResult>({
    queryKey: ["interview", id],
    queryFn: async () => {
      const res = await api.get(`/interviews/${id}`);
      return res.data;
    },
    enabled: !!id,
    // Poll every 5s while evaluation is still in progress
    refetchInterval: (query) => {
      const result = query.state.data;
      if (!result) return false;
      const report = result.report;
      if (
        report &&
        (report.overallScore > 0 ||
          report.summary !== "Değerlendirme hazırlanıyor...")
      ) {
        return false;
      }
      if (
        result.status === "completed" &&
        (!report || report.overallScore === 0)
      ) {
        return 5000;
      }
      return false;
    },
  });

  const error = queryError
    ? (queryError as Error & { response?: { data?: { message?: string } } })
        ?.response?.data?.message ||
      (queryError as Error).message ||
      "Bir hata oluştu"
    : null;

  if (loading) {
    return (
      <div className="results-page">
        <div className="loading-state">
          <Loader2 size={32} className="loader-icon" />
          <p>Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="results-page">
        <div className="error-state">
          <AlertTriangle size={32} />
          <p>{error || "Sonuçlar bulunamadı"}</p>
          <Link href="/dashboard">Dashboard&apos;a dön</Link>
        </div>
      </div>
    );
  }

  const report = data.report;
  const isEvaluating =
    report?.summary === "Değerlendirme hazırlanıyor..." ||
    (!report && data.status === "completed");
  const difficultyInfo = getDifficultyDisplay(data.difficulty);

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <Link href="/dashboard" className="back-link">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <h1>Mülakat Sonuçları</h1>
          <p className="result-meta">
            {data.field} • {data.techStack?.join(", ") || "—"}
            {difficultyInfo && (
              <>
                {" • "}
                <span
                  className="result-difficulty"
                  style={{
                    color: difficultyInfo.color,
                    background: difficultyInfo.bg,
                  }}
                >
                  {difficultyInfo.label}
                </span>
              </>
            )}
            {" • "}
            {new Date(data.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>

        {/* Evaluating state */}
        {isEvaluating && (
          <div className="evaluating-banner">
            <Loader2 size={18} className="loader-icon" />
            <span>
              Değerlendirmeniz yapılıyor, birkaç saniye içinde sonuçlar
              burada görünecek...
            </span>
          </div>
        )}

        {/* Scores Section */}
        {report && !isEvaluating && (
          <>
            {/* Hero Score */}
            <ScoreGauge score={report.overallScore} />

            {/* Category Breakdown */}
            <div className="section">
              <h2 className="section-title">Kategori Puanları</h2>
              <CategoryScores report={report} />
            </div>

            {/* Summary */}
            {report.summary && (
              <div className="section">
                <div className="summary-card">
                  <h3>
                    <FileText size={16} />
                    Özet
                  </h3>
                  <p>{report.summary}</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <div className="section">
                <div className="recommendations-card">
                  <h3>
                    <Lightbulb size={16} />
                    Öneriler
                  </h3>
                  <ul>
                    {report.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Question Details */}
            {report.questionEvaluations &&
              report.questionEvaluations.length > 0 && (
                <div className="section">
                  <h2 className="section-title">Soru Bazlı Değerlendirme</h2>
                  <QuestionDetails evaluations={report.questionEvaluations} />
                </div>
              )}
          </>
        )}

        {/* Chat History — always available when messages exist */}
        {data.messages && data.messages.length > 0 && (
          <div className="section">
            <h2 className="section-title">
              <MessageSquare size={16} />
              Sohbet Geçmişi
            </h2>
            <ChatHistory messages={data.messages} />
          </div>
        )}

        {/* Actions */}
        <div className="results-actions">
          <Link href="/interview" className="retry-btn">
            <Mic size={16} />
            Yeni Mülakat
          </Link>
          <Link href="/dashboard" className="dashboard-btn">
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
