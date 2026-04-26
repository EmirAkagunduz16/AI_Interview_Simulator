import type {
  IInterviewReport,
  IQuestionEvaluation,
} from "@ai-coach/shared-types";

// Re-export with local aliases for backwards compatibility
export type InterviewReport = IInterviewReport;
export type QuestionEvaluation = IQuestionEvaluation;

export interface CategoryScore {
  label: string;
  icon: string;
  score: number;
  color: string;
}

export interface InterviewResult {
  id: string;
  field: string;
  techStack: string[];
  difficulty?: string;
  status: string;
  report?: InterviewReport;
  createdAt: string;
  messages?: {
    role: "user" | "agent";
    content: string;
    createdAt: string;
  }[];
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
