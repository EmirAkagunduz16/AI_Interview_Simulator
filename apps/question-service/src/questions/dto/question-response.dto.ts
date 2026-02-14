import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, Difficulty } from '../entities/question.entity';

export class McqOptionResponseDto {
  @ApiProperty() text: string;
  @ApiProperty() isCorrect: boolean;
}

export class QuestionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() content: string;
  @ApiPropertyOptional() hints?: string;
  @ApiPropertyOptional() sampleAnswer?: string;
  @ApiProperty({ enum: QuestionType }) type: QuestionType;
  @ApiProperty({ enum: Difficulty }) difficulty: Difficulty;
  @ApiProperty() category: string;
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiProperty({ type: [McqOptionResponseDto] }) mcqOptions: McqOptionResponseDto[];
  @ApiProperty() usageCount: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedQuestionsResponseDto {
  @ApiProperty({ type: [QuestionResponseDto] }) questions: QuestionResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() totalPages: number;
}
