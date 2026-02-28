"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ScoreGauge,
  CategoryScores,
  QuestionDetails,
  ChatHistory,
} from "@/features/results/components";
import type { InterviewResult } from "@/features/results/types";
import api from "@/lib/axios";
import "./results.scss";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<
    "overview" | "questions" | "history"
  >("overview");

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
  });

  const error = queryError
    ? (queryError as any)?.response?.data?.message ||
      (queryError as Error).message ||
      "Bir hata oluştu"
    : null;

  if (loading) {
    return (
      <div className="results-page">
        <div className="loading-state">
          <div className="loader" />
          <p>Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="results-page">
        <div className="error-state">
          <p>⚠️ {error || "Sonuçlar bulunamadı"}</p>
          <Link href="/dashboard">Dashboard&apos;a dön</Link>
        </div>
      </div>
    );
  }

  const report = data.report;

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <Link href="/dashboard" className="back-link">
            ← Dashboard
          </Link>
          <h1>Mülakat Sonuçları</h1>
          <p className="result-meta">
            {data.field} • {data.techStack.join(", ")} •{" "}
            {new Date(data.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>

        {report && (
          <>
            <ScoreGauge score={report.overallScore} />
            <CategoryScores report={report} />

            <div className="tabs">
              <button
                className={`tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Genel Bakış
              </button>
              <button
                className={`tab ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Sohbet Geçmişi
              </button>
              <button
                className={`tab ${activeTab === "questions" ? "active" : ""}`}
                onClick={() => setActiveTab("questions")}
              >
                Soru Detayları
              </button>
            </div>

            {activeTab === "overview" ? (
              <>
                <div className="summary-card">
                  <h3>📝 Özet</h3>
                  <p>{report.summary}</p>
                </div>

                {report.recommendations?.length > 0 && (
                  <div className="recommendations-card">
                    <h3>💡 Öneriler</h3>
                    <ul>
                      {report.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : activeTab === "history" ? (
              <ChatHistory messages={data.messages || []} />
            ) : (
              <QuestionDetails evaluations={report.questionEvaluations || []} />
            )}
          </>
        )}

        {!report && (
          <div className="summary-card">
            <h3>⏳ Sonuçlar Hazırlanıyor</h3>
            <p>
              Değerlendirme henüz tamamlanmadı. Lütfen birkaç dakika sonra
              tekrar kontrol edin.
            </p>
          </div>
        )}

        <div className="results-actions">
          <Link href="/interview" className="retry-btn">
            🔄 Yeni Mülakat
          </Link>
          <Link href="/dashboard" className="dashboard-btn">
            📋 Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
