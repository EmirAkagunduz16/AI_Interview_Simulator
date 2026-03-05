import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
} from "class-validator";
import { Difficulty } from "../entities/question.entity";

export class GenerateQuestionsDto {
  @IsString()
  field: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  techStack: string[];

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  count?: number;
}
