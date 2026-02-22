// ===========================
// Question Types
// ===========================

export enum QuestionType {
  BEHAVIORAL = "behavioral",
  TECHNICAL = "technical",
  CODING = "coding",
  SYSTEM_DESIGN = "system_design",
  SITUATIONAL = "situational",
  MCQ = "mcq",
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export interface IQuestion {
  _id: string;
  title: string;
  content: string;
  hints?: string;
  sampleAnswer?: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  mcqOptions?: IMcqOption[];
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMcqOption {
  text: string;
  isCorrect: boolean;
}
