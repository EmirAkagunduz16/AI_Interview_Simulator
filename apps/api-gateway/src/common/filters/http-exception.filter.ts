import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

interface GrpcErrorDetails {
  code: number;
  message: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let error = "Internal Server Error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          (responseObj.message as string | string[]) || exception.message;
        error = (responseObj.error as string) || "Error";
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      const grpcError = exception as Error & {
        code?: number;
        details?: string;
      };

      let parsedDetails: GrpcErrorDetails | null = null;
      if (typeof grpcError.details === "string") {
        try {
          parsedDetails = JSON.parse(grpcError.details) as GrpcErrorDetails;
        } catch {
          // not JSON details
        }
      }

      const errorCode = parsedDetails?.code ?? grpcError.code;
      const errorMsg = parsedDetails?.message ?? grpcError.details;

      if (errorCode !== undefined && errorMsg) {
        if (errorCode === 16) status = HttpStatus.UNAUTHORIZED;
        else if (errorCode === 7) status = HttpStatus.FORBIDDEN;
        else if (errorCode === 5) status = HttpStatus.NOT_FOUND;
        else if (errorCode === 6) status = HttpStatus.CONFLICT;
        else if (errorCode === 3) status = HttpStatus.BAD_REQUEST;
        else status = HttpStatus.INTERNAL_SERVER_ERROR;

        message = errorMsg;
        error = "gRPC Error";
      } else {
        message = exception.message;
        this.logger.error(
          `Unhandled error: ${exception.message}`,
          exception.stack,
        );
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        JSON.stringify(errorResponse),
      );
    }

    response.status(status).json(errorResponse);
  }
}
