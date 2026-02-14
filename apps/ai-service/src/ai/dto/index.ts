import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// ========== Generate Questions ==========

export class GenerateQuestionsDto {
  @ApiProperty({
    example: "backend",
    description: "Interview field (backend, frontend, fullstack, etc.)",
  })
  @IsString()
  field: string;

  @ApiPropertyOptional({
    example: ["NestJS", "PostgreSQL", "TypeScript"],
    description: "Tech stack",
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techStack?: string[];

  @ApiPropertyOptional({
    example: "intermediate",
    description: "Difficulty: beginner, intermediate, advanced",
  })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({
    example: 5,
    description: "Number of questions to generate",
  })
  @IsNumber()
  @IsOptional()
  count?: number;

  @ApiPropertyOptional({ description: "Interview ID in Supabase" })
  @IsString()
  @IsOptional()
  interviewId?: string;
}

export class GeneratedQuestionDto {
  @ApiProperty() question: string;
  @ApiProperty() order: number;
  @ApiPropertyOptional() hints?: string;
  @ApiPropertyOptional() expectedKeyPoints?: string[];
}

export class GenerateQuestionsResponseDto {
  @ApiProperty({ type: [GeneratedQuestionDto] })
  questions: GeneratedQuestionDto[];
}

// ========== Evaluate Interview ==========

export class InterviewAnswerInput {
  @ApiProperty() question: string;
  @ApiProperty() answer: string;
  @ApiPropertyOptional() order?: number;
}

export class EvaluateInterviewDto {
  @ApiProperty({ description: "Interview ID" })
  @IsString()
  interviewId: string;

  @ApiProperty({ example: "backend" })
  @IsString()
  field: string;

  @ApiPropertyOptional({ example: ["NestJS", "PostgreSQL"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techStack?: string[];

  @ApiProperty({ type: [InterviewAnswerInput] })
  @IsArray()
  answers: InterviewAnswerInput[];
}

export class QuestionEvaluationDto {
  @ApiProperty() question: string;
  @ApiProperty() score: number;
  @ApiProperty() feedback: string;
  @ApiProperty({ type: [String] }) strengths: string[];
  @ApiProperty({ type: [String] }) improvements: string[];
}

export class InterviewReportDto {
  @ApiProperty() technicalScore: number;
  @ApiProperty() communicationScore: number;
  @ApiProperty() dictionScore: number;
  @ApiProperty() confidenceScore: number;
  @ApiProperty() overallScore: number;
  @ApiProperty() summary: string;
  @ApiProperty({ type: [String] }) recommendations: string[];
  @ApiProperty({ type: [QuestionEvaluationDto] })
  questionEvaluations: QuestionEvaluationDto[];
}

// ========== VAPI Webhook ==========

export class VapiWebhookDto {
  @ApiProperty() message: any;
}
