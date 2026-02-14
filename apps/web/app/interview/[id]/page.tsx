"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ScoreGauge,
  CategoryScores,
  QuestionDetails,
} from "@/features/results/components";
import type { InterviewResult } from "@/features/results/types";
import "./results.scss";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "questions">(
    "overview",
  );

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/interviews/${id}`, {
        headers: { "x-user-id": "demo-user" },
      });
      if (!res.ok) throw new Error("Sonuçlar yüklenemedi");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

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
          <a href="/dashboard">Dashboard&apos;a dön</a>
        </div>
      </div>
    );
  }

  const report = data.report;

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <a href="/dashboard" className="back-link">
            ← Dashboard
          </a>
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

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Genel Bakış
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
          <a href="/interview" className="retry-btn">
            🔄 Yeni Mülakat
          </a>
          <a href="/dashboard" className="dashboard-btn">
            📋 Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
