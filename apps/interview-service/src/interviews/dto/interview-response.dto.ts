import { InterviewStatus, InterviewType } from "../entities/interview.entity";

export class AnswerResponseDto {
  questionId: string;
  questionTitle: string;
  answer: string;
  feedback?: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  answeredAt: Date;
  evaluatedAt?: Date;
}

export class ReportResponseDto {
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  overallScore: number;
  summary?: string;
  recommendations?: string[];
}

export class InterviewResponseDto {
  id: string;
  userId: string;
  title?: string;
  field: string;
  techStack: string[];
  type: InterviewType;
  status: InterviewStatus;
  difficulty?: string;
  vapiCallId?: string;
  questionIds: string[];
  answers: AnswerResponseDto[];
  report?: ReportResponseDto;
  targetRole?: string;
  durationMinutes: number;
  totalScore?: number;
  overallFeedback?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedInterviewsResponseDto {
  interviews: InterviewResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}

export class InterviewStatsDto {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAnswered: number;
}
