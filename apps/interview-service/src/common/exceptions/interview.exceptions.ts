import { HttpException, HttpStatus } from "@nestjs/common";

export class InterviewNotFoundException extends HttpException {
  constructor(id: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        error: "Not Found",
        message: `Interview with ID ${id} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InterviewAlreadyStartedException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: "Interview has already been started",
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InterviewNotStartedException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: "Interview has not been started yet",
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InterviewAlreadyCompletedException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: "Interview has already been completed",
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
