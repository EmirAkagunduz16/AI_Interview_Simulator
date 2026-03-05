import { QuestionType, Difficulty } from "../entities/question.entity";

export class McqOptionResponseDto {
  text: string;
  isCorrect: boolean;
}

export class QuestionResponseDto {
  id: string;
  title: string;
  content: string;
  hints?: string;
  sampleAnswer?: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  mcqOptions: McqOptionResponseDto[];
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedQuestionsResponseDto {
  questions: QuestionResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}
