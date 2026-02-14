"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  supabase,
  Interview,
  InterviewQuestion,
  InterviewReport,
} from "../../../src/lib/supabase";
import "./results.scss";

type InterviewDetail = Interview & {
  interview_questions: InterviewQuestion[];
  interview_reports: InterviewReport[];
};

export default function InterviewResultsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "questions">(
    "overview",
  );

  const loadInterview = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("interviews")
        .select("*, interview_questions(*), interview_reports(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setInterview(data as InterviewDetail);
    } catch (error) {
      console.error("Failed to load interview:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadInterview();
  }, [id, loadInterview]);

  if (loading) {
    return (
      <div className="results-page">
        <div className="results-page__loading">
          <div className="spinner" />
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="results-page">
        <div className="results-page__error">
          <h2>Mülakat bulunamadı</h2>
          <a href="/dashboard" className="btn btn--primary">
            Panele Dön
          </a>
        </div>
      </div>
    );
  }

  const report = interview.interview_reports?.[0];
  const questions = (interview.interview_questions || []).sort(
    (a, b) => a.order_num - b.order_num,
  );

  function getScoreColor(score: number) {
    if (score >= 80) return "#4ade80";
    if (score >= 60) return "#60a5fa";
    if (score >= 40) return "#fbbf24";
    return "#f87171";
  }

  function getFieldLabel(field: string) {
    const fields: Record<string, string> = {
      backend: "Backend",
      frontend: "Frontend",
      fullstack: "Full Stack",
      mobile: "Mobil",
      devops: "DevOps",
    };
    return fields[field] || field;
  }

  const scoreCategories = report
    ? [
        { label: "Teknik Bilgi", score: report.technical_score, icon: "🔧" },
        { label: "İletişim", score: report.communication_score, icon: "💬" },
        { label: "Diksiyon", score: report.diction_score, icon: "🗣️" },
        { label: "Güven", score: report.confidence_score, icon: "💪" },
      ]
    : [];

  return (
    <div className="results-page">
      <div className="results-page__container">
        {/* Header */}
        <div className="results-page__header">
          <a href="/dashboard" className="results-page__back">
            ← Panele Dön
          </a>
          <div className="results-page__header-info">
            <h1 className="results-page__title">
              {getFieldLabel(interview.field)} Mülakat Sonuçları
            </h1>
            <div className="results-page__meta">
              {interview.tech_stack?.map((tech) => (
                <span key={tech} className="results-page__tag">
                  {tech}
                </span>
              ))}
              <span className="results-page__date">
                {new Date(interview.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        {report && (
          <div className="overall-score">
            <div
              className="overall-score__circle"
              style={
                {
                  "--score-color": getScoreColor(report.overall_score),
                } as React.CSSProperties
              }
            >
              <svg viewBox="0 0 120 120" className="overall-score__svg">
                <circle cx="60" cy="60" r="54" className="overall-score__bg" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  className="overall-score__progress"
                  style={{
                    strokeDasharray: `${(report.overall_score / 100) * 339.29} 339.29`,
                    stroke: getScoreColor(report.overall_score),
                  }}
                />
              </svg>
              <div className="overall-score__value">
                <span className="overall-score__number">
                  {report.overall_score}
                </span>
                <span className="overall-score__label">Genel Puan</span>
              </div>
            </div>

            <div className="overall-score__summary">
              <p>{report.summary}</p>
            </div>
          </div>
        )}

        {/* Score Categories */}
        {scoreCategories.length > 0 && (
          <div className="score-grid">
            {scoreCategories.map((cat) => (
              <div key={cat.label} className="score-card">
                <div className="score-card__header">
                  <span className="score-card__icon">{cat.icon}</span>
                  <span className="score-card__label">{cat.label}</span>
                </div>
                <div className="score-card__bar-container">
                  <div
                    className="score-card__bar"
                    style={{
                      width: `${cat.score}%`,
                      background: getScoreColor(cat.score),
                    }}
                  />
                </div>
                <span
                  className="score-card__value"
                  style={{ color: getScoreColor(cat.score) }}
                >
                  {cat.score}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {report && report.recommendations.length > 0 && (
          <div className="recommendations">
            <h3 className="recommendations__title">💡 Geliştirme Önerileri</h3>
            <ul className="recommendations__list">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="recommendations__item">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tabs__btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Genel Bakış
          </button>
          <button
            className={`tabs__btn ${activeTab === "questions" ? "active" : ""}`}
            onClick={() => setActiveTab("questions")}
          >
            Soru Detayları ({questions.length})
          </button>
        </div>

        {/* Questions Detail */}
        {activeTab === "questions" && (
          <div className="question-list">
            {questions.map((q) => (
              <div key={q.id} className="question-detail">
                <div className="question-detail__header">
                  <span className="question-detail__number">
                    Soru {q.order_num}
                  </span>
                  {q.score !== null && q.score !== undefined && (
                    <span
                      className="question-detail__score"
                      style={{ color: getScoreColor(q.score) }}
                    >
                      {q.score}%
                    </span>
                  )}
                </div>
                <p className="question-detail__question">{q.question_text}</p>

                {q.answer_transcript && (
                  <div className="question-detail__answer">
                    <h4>Cevabınız:</h4>
                    <p>{q.answer_transcript}</p>
                  </div>
                )}

                {q.feedback && (
                  <div className="question-detail__feedback">
                    <h4>AI Değerlendirmesi:</h4>
                    <p>{q.feedback}</p>
                  </div>
                )}

                {q.strengths && q.strengths.length > 0 && (
                  <div className="question-detail__strengths">
                    <h4>✅ Güçlü Yönler</h4>
                    <ul>
                      {q.strengths.map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {q.improvements && q.improvements.length > 0 && (
                  <div className="question-detail__improvements">
                    <h4>📈 Geliştirilecek Alanlar</h4>
                    <ul>
                      {q.improvements.map((imp, j) => (
                        <li key={j}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "overview" && report && (
          <div className="overview-content">
            <p className="overview-content__text">{report.summary}</p>
            {questions.filter((q) => q.score !== undefined && q.score !== null)
              .length > 0 && (
              <div className="overview-content__scores">
                <h4>Soru Bazlı Puanlar</h4>
                <div className="overview-content__bars">
                  {questions
                    .filter((q) => q.score !== undefined && q.score !== null)
                    .map((q) => (
                      <div key={q.id} className="overview-content__bar-row">
                        <span className="overview-content__bar-label">
                          S{q.order_num}
                        </span>
                        <div className="overview-content__bar-track">
                          <div
                            className="overview-content__bar-fill"
                            style={{
                              width: `${q.score}%`,
                              background: getScoreColor(q.score!),
                            }}
                          />
                        </div>
                        <span
                          className="overview-content__bar-value"
                          style={{ color: getScoreColor(q.score!) }}
                        >
                          {q.score}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
