"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mic,
  LayoutDashboard,
  FileText,
  MessageSquare,
  HelpCircle,
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

  const tabs = [
    {
      id: "overview" as const,
      label: "Genel Bakış",
      icon: <FileText size={15} />,
    },
    {
      id: "history" as const,
      label: "Sohbet Geçmişi",
      icon: <MessageSquare size={15} />,
    },
    ...(report?.questionEvaluations?.length
      ? [
          {
            id: "questions" as const,
            label: "Soru Detayları",
            icon: <HelpCircle size={15} />,
          },
        ]
      : []),
  ];

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <Link href="/dashboard" className="back-link">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <h1>Mülakat Sonuçları</h1>
          <p className="result-meta">
            {data.field} • {data.techStack?.join(", ") || "—"} •{" "}
            {new Date(data.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>

        {report && (
          <>
            <ScoreGauge score={report.overallScore} />
            <CategoryScores report={report} />
          </>
        )}

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          report ? (
            <>
              <div className="summary-card">
                <h3>
                  <FileText size={16} />
                  Özet
                </h3>
                <p>{report.summary}</p>
              </div>

              {report.recommendations?.length > 0 && (
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
              )}
            </>
          ) : (
            <div className="summary-card">
              <h3>
                <Loader2 size={16} className="loader-icon" />
                Sonuçlar Hazırlanıyor
              </h3>
              <p>
                Değerlendirme henüz tamamlanmadı. Lütfen birkaç dakika sonra
                tekrar kontrol edin.
              </p>
            </div>
          )
        ) : activeTab === "history" ? (
          <ChatHistory messages={data.messages || []} />
        ) : report ? (
          <QuestionDetails evaluations={report.questionEvaluations || []} />
        ) : null}

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
