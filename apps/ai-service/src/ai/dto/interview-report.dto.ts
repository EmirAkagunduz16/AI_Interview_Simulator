import { ApiProperty } from "@nestjs/swagger";

export class QuestionEvaluationDto {
  @ApiProperty()
  question: string;

  @ApiProperty()
  answer: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  feedback: string;

  @ApiProperty({ type: [String] })
  strengths: string[];

  @ApiProperty({ type: [String] })
  improvements: string[];
}

export class InterviewReportDto {
  @ApiProperty()
  technicalScore: number;

  @ApiProperty()
  communicationScore: number;

  @ApiProperty()
  dictionScore: number;

  @ApiProperty()
  confidenceScore: number;

  @ApiProperty()
  overallScore: number;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: [String] })
  recommendations: string[];

  @ApiProperty({ type: [QuestionEvaluationDto] })
  questionEvaluations: QuestionEvaluationDto[];
}
