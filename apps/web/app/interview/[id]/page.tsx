"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import "./results.scss";

interface InterviewData {
  id: string;
  field: string;
  techStack: string[];
  status: string;
  totalScore?: number;
  answers: {
    questionId: string;
    questionTitle: string;
    answer: string;
    score?: number;
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
  }[];
  report?: {
    technicalScore: number;
    communicationScore: number;
    dictionScore: number;
    confidenceScore: number;
    overallScore: number;
    summary?: string;
    recommendations?: string[];
  };
  createdAt: string;
  completedAt?: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_INTERVIEW_SERVICE_URL ||
  "http://localhost:3005/api/v1";

export default function InterviewResultsPage() {
  const params = useParams();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "questions">(
    "overview",
  );

  const loadInterview = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/interviews/${params.id}`, {
        headers: { "x-user-id": "anonymous" },
      });
      if (res.ok) {
        const data = await res.json();
        setInterview(data);
      }
    } catch (error) {
      console.error("Failed to load interview", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

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

  if (!interview) {
    return (
      <div className="results-page">
        <div className="error-state">
          <p>Mülakat bulunamadı.</p>
          <a href="/dashboard">Dashboard&apos;a dön</a>
        </div>
      </div>
    );
  }

  const report = interview.report;
  const overallScore = report?.overallScore || interview.totalScore || 0;

  const scoreCategories = [
    { label: "Teknik Bilgi", score: report?.technicalScore || 0, icon: "💻" },
    { label: "İletişim", score: report?.communicationScore || 0, icon: "💬" },
    { label: "Diksiyon", score: report?.dictionScore || 0, icon: "🗣️" },
    { label: "Güven", score: report?.confidenceScore || 0, icon: "💪" },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#34d399";
    if (score >= 60) return "#fbbf24";
    return "#f87171";
  };

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <a href="/dashboard" className="back-link">
            ← Dashboard
          </a>
          <h1>Mülakat Sonuçları</h1>
          <p className="result-meta">
            {interview.field} • {interview.techStack?.join(", ")} •{" "}
            {new Date(interview.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>

        {/* Score Gauge */}
        <div className="score-gauge-area">
          <div className="score-circle-large">
            <svg viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" className="gauge-bg" />
              <circle
                cx="80"
                cy="80"
                r="70"
                className="gauge-fill"
                style={{
                  stroke: getScoreColor(overallScore),
                  strokeDasharray: `${(overallScore / 100) * 440} 440`,
                }}
              />
            </svg>
            <div className="gauge-center">
              <span
                className="gauge-value"
                style={{ color: getScoreColor(overallScore) }}
              >
                {overallScore}
              </span>
              <span className="gauge-label">Genel Puan</span>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="categories-grid">
          {scoreCategories.map((cat) => (
            <div key={cat.label} className="category-card">
              <div className="cat-header">
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </div>
              <div className="cat-bar-wrapper">
                <div
                  className="cat-bar-fill"
                  style={{
                    width: `${cat.score}%`,
                    background: getScoreColor(cat.score),
                  }}
                />
              </div>
              <span
                className="cat-score"
                style={{ color: getScoreColor(cat.score) }}
              >
                {cat.score}/100
              </span>
            </div>
          ))}
        </div>

        {/* Summary & Recommendations */}
        {report?.summary && (
          <div className="summary-card">
            <h3>📝 Değerlendirme Özeti</h3>
            <p>{report.summary}</p>
          </div>
        )}

        {report?.recommendations && report.recommendations.length > 0 && (
          <div className="recommendations-card">
            <h3>💡 Öneriler</h3>
            <ul>
              {report.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

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
            Soru Detayları ({interview.answers?.length || 0})
          </button>
        </div>

        {/* Question Details */}
        {activeTab === "questions" && (
          <div className="questions-list">
            {interview.answers?.map((answer, i) => (
              <div key={i} className="question-detail-card">
                <div className="qd-header">
                  <span className="qd-number">Soru {i + 1}</span>
                  {answer.score !== undefined && (
                    <span
                      className="qd-score"
                      style={{ color: getScoreColor(answer.score) }}
                    >
                      {answer.score}/100
                    </span>
                  )}
                </div>
                <p className="qd-question">{answer.questionTitle}</p>
                <div className="qd-answer">
                  <span className="qd-label">Cevabınız:</span>
                  <p>{answer.answer}</p>
                </div>
                {answer.feedback && (
                  <div className="qd-feedback">
                    <span className="qd-label">Geri Bildirim:</span>
                    <p>{answer.feedback}</p>
                  </div>
                )}
                {answer.strengths && answer.strengths.length > 0 && (
                  <div className="qd-strengths">
                    <span className="qd-label">✅ Güçlü Yönler:</span>
                    <ul>
                      {answer.strengths.map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {answer.improvements && answer.improvements.length > 0 && (
                  <div className="qd-improvements">
                    <span className="qd-label">📈 Gelişim Alanları:</span>
                    <ul>
                      {answer.improvements.map((imp, j) => (
                        <li key={j}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="results-actions">
          <a href="/interview" className="retry-btn">
            🎤 Yeni Mülakat
          </a>
          <a href="/dashboard" className="dashboard-btn">
            📋 Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
