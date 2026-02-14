"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../common/hooks/useAppDispatch";
import { resetInterview } from "../../store/interviewSlice";
import Card from "../../../../common/components/Card";
import Button from "../../../../common/components/Button";
import "./result-card.styles.scss";

const ResultCard = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { answers, questions } = useAppSelector((state) => state.interview);

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;

  const handleGoHome = () => {
    dispatch(resetInterview());
    router.push("/");
  };

  const handleRetry = () => {
    dispatch(resetInterview());
    router.push("/select-field");
  };

  return (
    <div className="result-card-wrapper">
      <Card title="" className="result-card">
        <div className="result-card__content">
          <div className="result-card__icon">&#x1F389;</div>
          <h2 className="result-card__title">Tebrikler!</h2>
          <p className="result-card__subtitle">
            Mülakatınızı başarıyla tamamladınız.
          </p>

          <div className="result-card__stats">
            <div className="result-card__stat">
              <span className="result-card__stat-value">
                {answeredCount}/{totalCount}
              </span>
              <span className="result-card__stat-label">Cevaplanan Soru</span>
            </div>
            <div className="result-card__stat">
              <span className="result-card__stat-value">4</span>
              <span className="result-card__stat-label">Soru Türü</span>
            </div>
          </div>

          <div className="result-card__summary">
            <h3 className="result-card__summary-title">Soru Özeti</h3>
            <div className="result-card__summary-list">
              {questions.map((q, index) => {
                const isAnswered = !!answers[q.id];
                const typeLabels: Record<string, string> = {
                  audio: "Sesli",
                  video: "Görüntülü",
                  mcq: "Çoktan Seçmeli",
                  coding: "Kodlama",
                };
                return (
                  <div key={q.id} className="result-card__summary-item">
                    <div
                      className={`result-card__summary-status ${isAnswered ? "answered" : "unanswered"}`}
                    >
                      {isAnswered ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </div>
                    <span className="result-card__summary-label">
                      Soru {index + 1} - {typeLabels[q.type] || q.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="result-card__message">
            Performansınız AI tarafından değerlendirilecektir.
            <br />
            Backend entegrasyonu tamamlandığında detaylı rapor alabileceksiniz.
          </p>

          <div className="result-card__actions">
            <Button variant="secondary" onClick={handleGoHome}>
              Anasayfaya Dön
            </Button>
            <Button onClick={handleRetry}>Yeni Mülakat Başla</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultCard;
