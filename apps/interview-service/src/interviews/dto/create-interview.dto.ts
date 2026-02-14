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
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { InterviewType } from "../entities/interview.entity";

export class CreateInterviewDto {
  @ApiProperty({ example: "backend", description: "Interview field" })
  @IsString()
  field: string;

  @ApiProperty({
    example: ["Node.js", "NestJS", "TypeScript"],
    description: "Tech stack",
  })
  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @ApiPropertyOptional({ example: "intermediate", default: "intermediate" })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ example: "Backend Developer Interview" })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    enum: InterviewType,
    default: InterviewType.TECHNICAL,
  })
  @IsEnum(InterviewType)
  @IsOptional()
  type?: InterviewType;

  @ApiPropertyOptional({ example: "Senior Backend Developer" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  targetRole?: string;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsNumber()
  @Min(5)
  @Max(120)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  questionCount?: number;

  @ApiPropertyOptional({ description: "VAPI call ID for voice interviews" })
  @IsString()
  @IsOptional()
  vapiCallId?: string;
}
