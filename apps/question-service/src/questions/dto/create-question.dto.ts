import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  ValidateNested,
  IsBoolean,
  MinLength,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { QuestionType, Difficulty } from "../entities/question.entity";

export class McqOptionDto {
  @IsString()
  @MinLength(1)
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  hints?: string;

  @IsString()
  @IsOptional()
  sampleAnswer?: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsString()
  @MinLength(2)
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ValidateNested({ each: true })
  @Type(() => McqOptionDto)
  @IsOptional()
  mcqOptions?: McqOptionDto[];

  /**
   * Origin of the question. Optional for callers; defaults to "seed" at the
   * schema level. The AI service uses "ai-generated" when capturing agent
   * utterances during a live interview so they're easy to distinguish from
   * curated seed and community questions.
   */
  @IsString()
  @IsOptional()
  @IsEnum(["seed", "ai-generated", "community"])
  createdBy?: "seed" | "ai-generated" | "community";
}
