import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  questionTitle: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: "Answer must not exceed 10000 characters" })
  answer: string;
}
