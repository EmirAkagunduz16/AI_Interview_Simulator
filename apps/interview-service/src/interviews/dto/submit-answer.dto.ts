import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SubmitAnswerDto {
  @ApiProperty({ description: "Question ID being answered" })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: "Question title/text" })
  @IsString()
  @IsNotEmpty()
  questionTitle: string;

  @ApiProperty({ description: "User answer text (voice transcript or typed)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: "Answer must not exceed 10000 characters" })
  answer: string;
}
