import { HttpException, HttpStatus } from '@nestjs/common';

export class QuestionNotFoundException extends HttpException {
  constructor(id: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: `Question with ID ${id} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidQuestionDataException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
