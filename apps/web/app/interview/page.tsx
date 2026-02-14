"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useVapi } from "../../src/hooks/useVapi";
import { supabase } from "../../src/lib/supabase";
import "./interview.scss";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";

interface TranscriptEntry {
  role: "assistant" | "user";
  text: string;
  timestamp: Date;
}

export default function InterviewPage() {
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState<
    "idle" | "connecting" | "pre-interview" | "in-progress" | "completed"
  >("idle");
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const {
    start,
    stop,
    isActive,
    isConnecting,
    transcript,
    isSpeaking,
    volumeLevel,
  } = useVapi({
    publicKey: VAPI_PUBLIC_KEY,
    assistantId: VAPI_ASSISTANT_ID,
    onCallStart: () => {
      setInterviewStatus("pre-interview");
    },
    onCallEnd: () => {
      if (interviewStatus !== "completed") {
        setInterviewStatus("completed");
      }
    },
    onFunctionCall: (name, params) => {
      switch (name) {
        case "save_preferences":
          if (params.interviewId) {
            setInterviewId(params.interviewId);
          }
          break;
        case "get_next_question":
          if (params.question) {
            setCurrentQuestion(params.question);
            setQuestionNumber(params.order || questionNumber + 1);
            setTotalQuestions(params.totalQuestions || totalQuestions);
            setInterviewStatus("in-progress");
          }
          if (params.finished) {
            setInterviewStatus("completed");
          }
          break;
        case "end_interview":
          if (params.overallScore) {
            setFinalScore(params.overallScore);
          }
          setInterviewStatus("completed");
          break;
      }
    },
    onError: (error) => {
      console.error("VAPI error:", error);
    },
  });

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleStart = useCallback(async () => {
    setInterviewStatus("connecting");
    await start();
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
    setInterviewStatus("completed");
  }, [stop]);

  const handleViewResults = () => {
    if (interviewId) {
      window.location.href = `/interview/${interviewId}`;
    }
  };

  // Generate volume bars
  const volumeBars = Array.from({ length: 12 }, (_, i) => {
    const threshold = (i + 1) / 12;
    const active = volumeLevel > threshold * 0.5;
    return (
      <div
        key={i}
        className={`volume-bar ${active ? "active" : ""} ${isSpeaking ? "speaking" : ""}`}
        style={{
          height: `${20 + Math.random() * 30 + (active ? volumeLevel * 40 : 0)}px`,
          animationDelay: `${i * 0.05}s`,
        }}
      />
    );
  });

  return (
    <div className="interview-page">
      <div className="interview-page__header">
        <a href="/dashboard" className="interview-page__back">
          ← Panele Dön
        </a>
        <h1 className="interview-page__title">AI Mülakat</h1>
        {interviewStatus === "in-progress" && totalQuestions > 0 && (
          <div className="interview-page__progress">
            Soru {questionNumber} / {totalQuestions}
          </div>
        )}
      </div>

      <div className="interview-page__content">
        {/* Voice Visualizer */}
        <div className={`voice-visualizer ${isActive ? "active" : ""}`}>
          <div className="voice-visualizer__orb">
            <div
              className={`voice-visualizer__pulse ${isSpeaking ? "speaking" : ""}`}
            />
            <div className="voice-visualizer__icon">
              {isConnecting ? (
                <span className="voice-visualizer__spinner" />
              ) : isActive ? (
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </div>
          </div>

          {isActive && (
            <div className="voice-visualizer__bars">{volumeBars}</div>
          )}

          <p className="voice-visualizer__status">
            {interviewStatus === "idle" &&
              "Mülakata başlamak için butona tıklayın"}
            {interviewStatus === "connecting" && "Bağlanıyor..."}
            {interviewStatus === "pre-interview" &&
              "AI asistanla konuşun — alanınızı ve teknolojilerinizi belirtin"}
            {interviewStatus === "in-progress" &&
              (isSpeaking ? "AI konuşuyor..." : "Sizi dinliyor...")}
            {interviewStatus === "completed" && "Mülakat tamamlandı!"}
          </p>
        </div>

        {/* Current Question */}
        {currentQuestion && interviewStatus === "in-progress" && (
          <div className="current-question">
            <div className="current-question__badge">Soru {questionNumber}</div>
            <p className="current-question__text">{currentQuestion}</p>
          </div>
        )}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="transcript">
            <h3 className="transcript__title">Konuşma Geçmişi</h3>
            <div className="transcript__list">
              {transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`transcript__entry transcript__entry--${entry.role}`}
                >
                  <span className="transcript__role">
                    {entry.role === "assistant" ? "🤖 AI" : "👤 Siz"}
                  </span>
                  <p className="transcript__text">{entry.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="interview-page__actions">
          {interviewStatus === "idle" && (
            <button
              className="btn btn--primary btn--large"
              onClick={handleStart}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
              Mülakata Başla
            </button>
          )}

          {(interviewStatus === "pre-interview" ||
            interviewStatus === "in-progress") && (
            <button className="btn btn--danger" onClick={handleStop}>
              Mülakatı Bitir
            </button>
          )}

          {interviewStatus === "completed" && (
            <div className="interview-page__completed">
              {finalScore !== null && (
                <div className="interview-page__score">
                  <span className="interview-page__score-value">
                    {finalScore}
                  </span>
                  <span className="interview-page__score-label">
                    Genel Puan
                  </span>
                </div>
              )}
              <div className="interview-page__completed-actions">
                {interviewId && (
                  <button
                    className="btn btn--primary"
                    onClick={handleViewResults}
                  >
                    Sonuçları Gör
                  </button>
                )}
                <a href="/dashboard" className="btn btn--secondary">
                  Panele Dön
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
