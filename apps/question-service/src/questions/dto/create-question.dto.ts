import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  ValidateNested,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QuestionType, Difficulty } from '../entities/question.entity';

export class McqOptionDto {
  @ApiProperty({ example: 'Option A text' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'Describe a time when you had to work with a difficult team member' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title: string;

  @ApiProperty({ example: 'Detailed question content with context and expectations...' })
  @IsString()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({ example: 'Think about the STAR method' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  hints?: string;

  @ApiPropertyOptional({ example: 'A good answer would include...' })
  @IsString()
  @IsOptional()
  sampleAnswer?: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.BEHAVIORAL })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ enum: Difficulty, example: Difficulty.MEDIUM })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ example: 'Communication Skills' })
  @IsString()
  @MinLength(2)
  category: string;

  @ApiPropertyOptional({ type: [String], example: ['teamwork', 'conflict-resolution'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [McqOptionDto] })
  @ValidateNested({ each: true })
  @Type(() => McqOptionDto)
  @IsOptional()
  mcqOptions?: McqOptionDto[];
}
