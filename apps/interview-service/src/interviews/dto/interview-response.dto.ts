import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { InterviewStatus, InterviewType } from "../entities/interview.entity";

export class AnswerResponseDto {
  @ApiProperty() questionId: string;
  @ApiProperty() questionTitle: string;
  @ApiProperty() answer: string;
  @ApiPropertyOptional() feedback?: string;
  @ApiPropertyOptional() score?: number;
  @ApiPropertyOptional({ type: [String] }) strengths?: string[];
  @ApiPropertyOptional({ type: [String] }) improvements?: string[];
  @ApiProperty() answeredAt: Date;
  @ApiPropertyOptional() evaluatedAt?: Date;
}

export class ReportResponseDto {
  @ApiProperty() technicalScore: number;
  @ApiProperty() communicationScore: number;
  @ApiProperty() dictionScore: number;
  @ApiProperty() confidenceScore: number;
  @ApiProperty() overallScore: number;
  @ApiPropertyOptional() summary?: string;
  @ApiPropertyOptional({ type: [String] }) recommendations?: string[];
}

export class InterviewResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional() title?: string;
  @ApiProperty() field: string;
  @ApiProperty({ type: [String] }) techStack: string[];
  @ApiProperty({ enum: InterviewType }) type: InterviewType;
  @ApiProperty({ enum: InterviewStatus }) status: InterviewStatus;
  @ApiPropertyOptional() difficulty?: string;
  @ApiPropertyOptional() vapiCallId?: string;
  @ApiProperty({ type: [String] }) questionIds: string[];
  @ApiProperty({ type: [AnswerResponseDto] }) answers: AnswerResponseDto[];
  @ApiPropertyOptional({ type: ReportResponseDto }) report?: ReportResponseDto;
  @ApiPropertyOptional() targetRole?: string;
  @ApiProperty() durationMinutes: number;
  @ApiPropertyOptional() totalScore?: number;
  @ApiPropertyOptional() overallFeedback?: string;
  @ApiPropertyOptional() startedAt?: Date;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedInterviewsResponseDto {
  @ApiProperty({ type: [InterviewResponseDto] })
  interviews: InterviewResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() totalPages: number;
}

export class InterviewStatsDto {
  @ApiProperty() totalInterviews: number;
  @ApiProperty() completedInterviews: number;
  @ApiProperty() averageScore: number;
  @ApiProperty() bestScore: number;
  @ApiProperty() totalQuestionsAnswered: number;
}
