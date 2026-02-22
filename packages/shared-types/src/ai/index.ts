import { IQuestionEvaluation } from "../interview";

// ===========================
// AI Types
// ===========================

export interface IGeneratedQuestion {
  question: string;
  category: string;
  order: number;
}

export interface IInterviewEvaluation {
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  overallScore: number;
  summary: string;
  recommendations: string[];
  questionEvaluations: IQuestionEvaluation[];
}

export interface IEvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface IChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
