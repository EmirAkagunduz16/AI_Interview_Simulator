import { IsString, IsArray } from "class-validator";

export class InterviewAnswerDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  order: number;
}

export class EvaluateInterviewDto {
  @IsString()
  field: string;

  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @IsArray()
  answers: InterviewAnswerDto[];
}
