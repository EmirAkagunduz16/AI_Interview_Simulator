"use client";

interface ScoreGaugeProps {
  score: number;
}

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const circumference = 2 * Math.PI * 70;
  const dashArray = (score / 100) * circumference;
  const gaugeColor =
    score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";

  return (
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
              strokeDasharray: `${dashArray} ${circumference}`,
              stroke: gaugeColor,
            }}
          />
        </svg>
        <div className="gauge-center">
          <span className="gauge-value" style={{ color: gaugeColor }}>
            {score}
          </span>
          <span className="gauge-label">Genel Puan</span>
        </div>
      </div>
    </div>
  );
}
