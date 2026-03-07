import { Catch, RpcExceptionFilter, ArgumentsHost, HttpException } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { RpcException } from "@nestjs/microservices";

@Catch(HttpException)
export class GrpcExceptionFilter implements RpcExceptionFilter<HttpException> {
  catch(exception: HttpException, _host: ArgumentsHost): Observable<never> {
    const statusInfo = exception.getStatus();

    let grpcStatus = 13; // INTERNAL

    if (statusInfo === 401)
      grpcStatus = 16; // UNAUTHENTICATED
    else if (statusInfo === 403)
      grpcStatus = 7; // PERMISSION_DENIED
    else if (statusInfo === 404)
      grpcStatus = 5; // NOT_FOUND
    else if (statusInfo === 409)
      grpcStatus = 6; // ALREADY_EXISTS
    else if (statusInfo === 400) grpcStatus = 3; // INVALID_ARGUMENT

    const response = exception.getResponse();
    let message = exception.message;

    if (
      typeof response === "object" &&
      response !== null &&
      "message" in response
    ) {
      const responseMessage = (response as { message: string | string[] })
        .message;
      message = Array.isArray(responseMessage)
        ? responseMessage.join(", ")
        : responseMessage;
    }

    return throwError(
      () =>
        new RpcException(
          JSON.stringify({
            code: grpcStatus,
            message: message,
          }),
        ),
    );
  }
}
