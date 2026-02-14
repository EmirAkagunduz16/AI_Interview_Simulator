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
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Difficulty } from "../entities/question.entity";

export class GenerateQuestionsDto {
  @ApiProperty({
    example: "backend",
    description: "Interview field (backend, frontend, fullstack, etc.)",
  })
  @IsString()
  field: string;

  @ApiProperty({
    type: [String],
    example: ["Node.js", "TypeScript", "PostgreSQL"],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  techStack: string[];

  @ApiProperty({ enum: Difficulty, example: Difficulty.MEDIUM })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: "Number of questions to generate",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  count?: number;
}
