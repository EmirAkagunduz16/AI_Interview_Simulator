import { HttpException, HttpStatus } from "@nestjs/common";

export class AIServiceException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: "AI Service Error",
        message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
