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
  FOLLOW_UP = "follow_up",
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

/**
 * Maps interview level (junior/intermediate/senior) to question difficulty (easy/medium/hard).
 * Use when creating or querying questions from interview context.
 */
export function mapInterviewDifficultyToQuestionDifficulty(
  interviewDifficulty: string,
): Difficulty {
  const d = (interviewDifficulty || "intermediate").toLowerCase();
  switch (d) {
    case "junior":
      return Difficulty.EASY;
    case "intermediate":
      return Difficulty.MEDIUM;
    case "senior":
      return Difficulty.HARD;
    case "easy":
    case "medium":
    case "hard":
      return d as Difficulty;
    default:
      return Difficulty.MEDIUM;
  }
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
