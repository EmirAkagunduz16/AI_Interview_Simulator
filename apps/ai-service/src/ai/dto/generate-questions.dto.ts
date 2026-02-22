import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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
  @ApiProperty()
  question: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  order: number;
}

export class GenerateQuestionsResponseDto {
  @ApiProperty({ type: [GeneratedQuestionDto] })
  questions: GeneratedQuestionDto[];
}
