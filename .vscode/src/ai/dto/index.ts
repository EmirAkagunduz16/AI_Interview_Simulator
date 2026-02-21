import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Generate Questions
export class GenerateQuestionsDto {
  @ApiProperty({ example: "backend" })
  @IsString()
  field: string;

  @ApiProperty({ example: ["Node.js", "NestJS"] })
  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @ApiPropertyOptional({ example: "intermediate" })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  count?: number;
}

export class GeneratedQuestionDto {
  @ApiProperty() question: string;
  @ApiProperty() category: string;
  @ApiProperty() order: number;
}

export class GenerateQuestionsResponseDto {
  @ApiProperty({ type: [GeneratedQuestionDto] })
  questions: GeneratedQuestionDto[];
}

// Evaluate Interview
export class InterviewAnswerDto {
  @ApiProperty() question: string;
  @ApiProperty() answer: string;
  @ApiProperty() order: number;
}

export class EvaluateInterviewDto {
  @ApiProperty({ example: "backend" })
  @IsString()
  field: string;

  @ApiProperty({ example: ["Node.js"] })
  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @ApiProperty({ type: [InterviewAnswerDto] })
  @IsArray()
  answers: InterviewAnswerDto[];
}

export class InterviewReportDto {
  @ApiProperty() technicalScore: number;
  @ApiProperty() communicationScore: number;
  @ApiProperty() dictionScore: number;
  @ApiProperty() confidenceScore: number;
  @ApiProperty() overallScore: number;
  @ApiProperty() summary: string;
  @ApiProperty({ type: [String] }) recommendations: string[];
  @ApiProperty() questionEvaluations: QuestionEvaluationDto[];
}

export class QuestionEvaluationDto {
  @ApiProperty() question: string;
  @ApiProperty() answer: string;
  @ApiProperty() score: number;
  @ApiProperty() feedback: string;
  @ApiProperty({ type: [String] }) strengths: string[];
  @ApiProperty({ type: [String] }) improvements: string[];
}
