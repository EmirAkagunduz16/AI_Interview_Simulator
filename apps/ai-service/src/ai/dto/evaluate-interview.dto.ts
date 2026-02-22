import { IsString, IsArray } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class InterviewAnswerDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiProperty()
  @IsString()
  answer: string;

  @ApiProperty()
  order: number;
}

export class EvaluateInterviewDto {
  @ApiProperty({ example: "backend" })
  @IsString()
  field: string;

  @ApiProperty({ example: ["Node.js"] })
  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @ApiProperty({ type: [InterviewAnswerDto] })
  @IsArray()
  answers: InterviewAnswerDto[];
}
