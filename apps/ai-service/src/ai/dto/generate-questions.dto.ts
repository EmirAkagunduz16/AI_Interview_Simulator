import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from "class-validator";

export class GenerateQuestionsDto {
  @IsString()
  field: string;

  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  count?: number;
}

export class GeneratedQuestionDto {
  question: string;
  category: string;
  order: number;
}

export class GenerateQuestionsResponseDto {
  questions: GeneratedQuestionDto[];
}
