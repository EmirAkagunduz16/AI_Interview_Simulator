export interface CategoryScore {
  label: string;
  icon: string;
  score: number;
  color: string;
}

export interface QuestionEvaluation {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewReport {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  summary: string;
  recommendations: string[];
  questionEvaluations: QuestionEvaluation[];
}

export interface InterviewResult {
  id: string;
  field: string;
  techStack: string[];
  status: string;
  report?: InterviewReport;
  createdAt: string;
}

/**
 * Static category definitions for the score display.
 */
export const SCORE_CATEGORIES = [
  {
    key: "technicalScore",
    label: "Teknik Bilgi",
    icon: "💻",
    color: "#a78bfa",
  },
  {
    key: "communicationScore",
    label: "İletişim",
    icon: "🗣️",
    color: "#60a5fa",
  },
  { key: "dictionScore", label: "Diksiyon", icon: "🎯", color: "#34d399" },
  { key: "confidenceScore", label: "Özgüven", icon: "💪", color: "#f472b6" },
] as const;
