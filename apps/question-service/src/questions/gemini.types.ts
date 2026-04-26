export interface GeneratedQuestion {
  title: string;
  content: string;
  sampleAnswer?: string;
}

export interface QuestionClassification {
  title: string;
  category: string;
  difficulty: string;
  tags: string[];
}

export const VALID_CATEGORIES = [
  "backend",
  "frontend",
  "fullstack",
  "mobile",
  "devops",
  "data_science",
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

export const VALID_DIFFICULTIES = ["junior", "intermediate", "senior"] as const;

export type ValidDifficulty = (typeof VALID_DIFFICULTIES)[number];
