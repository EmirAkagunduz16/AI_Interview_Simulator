import { HttpException, HttpStatus } from "@nestjs/common";

export class UserNotFoundException extends HttpException {
  constructor(identifier: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        error: "Not Found",
        message: `User with identifier ${identifier} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class UserAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        error: "Conflict",
        message: `User with email ${email} already exists`,
      },
      HttpStatus.CONFLICT,
    );
  }
}
