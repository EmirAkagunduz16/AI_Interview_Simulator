"use client";

interface CompletedScreenProps {
  overallScore: number | null;
  interviewId: string | null;
  onRetry: () => void;
}

export default function CompletedScreen({
  overallScore,
  interviewId,
  onRetry,
}: CompletedScreenProps) {
  return (
    <div className="completed-container">
      <div className="completed-header">
        <div className="score-circle">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" className="score-bg" />
            <circle
              cx="60"
              cy="60"
              r="54"
              className="score-fill"
              style={{
                strokeDasharray: `${((overallScore || 0) / 100) * 339.3} 339.3`,
              }}
            />
          </svg>
          <span className="score-value">{overallScore || 0}</span>
        </div>
        <h1>Mülakat Tamamlandı!</h1>
        <p>Detaylı sonuçlarınız hazırlanıyor...</p>
      </div>

      <div className="completed-actions">
        {interviewId && (
          <a href={`/interview/${interviewId}`} className="view-results-btn">
            📊 Detaylı Sonuçları Gör
          </a>
        )}
        <a href="/dashboard" className="dashboard-btn">
          📋 Dashboard&apos;a Git
        </a>
        <button className="retry-btn" onClick={onRetry}>
          🔄 Yeni Mülakat
        </button>
      </div>
    </div>
  );
}
