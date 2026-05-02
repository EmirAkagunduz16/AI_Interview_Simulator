import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, Min } from "class-validator";
import { Type } from "class-transformer";
import { QuestionType, Difficulty } from "../entities/question.entity";

export class QueryQuestionsDto {
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

export class RandomQuestionsDto {
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  count?: number = 5;

  @IsString({ each: true })
  @IsOptional()
  excludeIds?: string[];

  @IsBoolean()
  @IsOptional()
  excludeCommunity?: boolean;
}
