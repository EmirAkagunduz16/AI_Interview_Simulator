"use client";

import { useState, useEffect } from "react";

interface ScoreGaugeProps {
  score: number;
}

function getPerformanceLevel(score: number) {
  if (score >= 80) return { label: "Mükemmel", emoji: "⭐", class: "level-excellent" };
  if (score >= 60) return { label: "İyi", emoji: "👍", class: "level-good" };
  if (score >= 40) return { label: "Orta", emoji: "⚡", class: "level-average" };
  return { label: "Geliştirilebilir", emoji: "📈", class: "level-needs-work" };
}

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const circumference = 2 * Math.PI * 70;
  const dashArray = (displayScore / 100) * circumference;
  const gaugeColor =
    score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : score >= 40 ? "#f97316" : "#f87171";
  const level = getPerformanceLevel(score);

  // Count-up animation
  useEffect(() => {
    if (score === 0) { setDisplayScore(0); return; }
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setDisplayScore(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="score-hero">
      <div className="score-gauge-area">
        <div className="score-circle-large">
          <svg viewBox="0 0 160 160">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gaugeColor} stopOpacity="1" />
                <stop offset="100%" stopColor={gaugeColor} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r="70" className="gauge-bg" />
            <circle
              cx="80"
              cy="80"
              r="70"
              className="gauge-fill"
              style={{
                strokeDasharray: `${dashArray} ${circumference}`,
                stroke: "url(#gaugeGradient)",
              }}
            />
          </svg>
          <div className="gauge-center">
            <span className="gauge-value" style={{ color: gaugeColor }}>
              {displayScore}
            </span>
            <span className="gauge-label">Genel Puan</span>
          </div>
          {/* Glow ring */}
          <div
            className="gauge-glow"
            style={{ boxShadow: `0 0 40px ${gaugeColor}33, 0 0 80px ${gaugeColor}11` }}
          />
        </div>
      </div>
      <div className={`performance-badge ${level.class}`}>
        <span className="badge-emoji">{level.emoji}</span>
        <span className="badge-label">{level.label}</span>
      </div>
    </div>
  );
}
