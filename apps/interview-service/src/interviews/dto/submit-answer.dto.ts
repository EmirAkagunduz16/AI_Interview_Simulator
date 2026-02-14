import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Question ID being answered' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'User answer text' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Answer must be at least 10 characters' })
  @MaxLength(10000, { message: 'Answer must not exceed 10000 characters' })
  answer: string;
}
