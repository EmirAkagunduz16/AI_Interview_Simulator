import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { AuthService } from "./auth.service";

interface ValidateTokenRequest {
  access_token: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  user_id: string;
  email: string;
  role: string;
}

interface GetTokenUserRequest {
  access_token: string;
}

interface GetTokenUserResponse {
  user_id: string;
  email: string;
  name: string;
  role: string;
}

@Controller()
export class GrpcAuthController {
  private readonly logger = new Logger(GrpcAuthController.name);

  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("AuthService", "ValidateToken")
  async validateToken(
    data: ValidateTokenRequest,
  ): Promise<ValidateTokenResponse> {
    this.logger.debug("gRPC ValidateToken called");

    const result = await this.authService.validate(data.access_token);

    return {
      valid: result.valid,
      user_id: result.userId,
      email: result.email,
      role: result.role,
    };
  }

  @GrpcMethod("AuthService", "GetTokenUser")
  async getTokenUser(data: GetTokenUserRequest): Promise<GetTokenUserResponse> {
    this.logger.debug("gRPC GetTokenUser called");

    const result = await this.authService.validate(data.access_token);

    if (!result.valid) {
      return { user_id: "", email: "", name: "", role: "" };
    }

    return {
      user_id: result.userId,
      email: result.email,
      name: "",
      role: result.role,
    };
  }
}
