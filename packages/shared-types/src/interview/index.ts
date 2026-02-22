import { Difficulty } from "../question";

// ===========================
// Interview Types
// ===========================

export enum InterviewStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum InterviewType {
  BEHAVIORAL = "behavioral",
  TECHNICAL = "technical",
  MIXED = "mixed",
  SYSTEM_DESIGN = "system_design",
}

export interface IInterview {
  _id: string;
  userId: string;
  title?: string;
  field: string;
  techStack: string[];
  type: InterviewType;
  status: InterviewStatus;
  difficulty: string;
  vapiCallId?: string;
  questionIds: string[];
  answers: IInterviewAnswer[];
  report?: IInterviewReport;
  targetRole?: string;
  durationMinutes: number;
  totalScore?: number;
  overallFeedback?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInterviewAnswer {
  questionId: string;
  questionTitle: string;
  answer: string;
  feedback?: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  answeredAt?: Date;
  evaluatedAt?: Date;
}

export interface IInterviewReport {
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  overallScore: number;
  summary?: string;
  recommendations: string[];
  questionEvaluations?: IQuestionEvaluation[];
}

export interface IQuestionEvaluation {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// ===========================
// Interview Field & Config
// ===========================

export enum InterviewField {
  BACKEND = "backend",
  FRONTEND = "frontend",
  FULLSTACK = "fullstack",
  MOBILE = "mobile",
  DEVOPS = "devops",
  DATA_SCIENCE = "data_science",
}

export interface IVapiInterviewConfig {
  field: InterviewField | string;
  techStack: string[];
  difficulty: Difficulty | string;
  userId?: string;
}
