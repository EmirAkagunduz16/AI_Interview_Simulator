import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { InterviewType } from "../entities/interview.entity";

export class CreateInterviewDto {
  @IsString()
  field: string;

  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsEnum(InterviewType)
  @IsOptional()
  type?: InterviewType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  targetRole?: string;

  @IsNumber()
  @Min(5)
  @Max(120)
  @IsOptional()
  durationMinutes?: number;

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  questionCount?: number;

  @IsString()
  @IsOptional()
  vapiCallId?: string;
}
