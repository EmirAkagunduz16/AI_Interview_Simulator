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
  async validateToken(data: any): Promise<ValidateTokenResponse> {
    this.logger.debug("gRPC ValidateToken called");
    require("fs").appendFileSync(
      "auth-debug.log",
      `Data Dump: ${JSON.stringify(data)} | acc_token: ${data.access_token} | accTo: ${data.accessToken}\n`,
    );

    const result = await this.authService.validate(
      data.access_token || data.accessToken,
    );

    return {
      valid: result.valid,
      userId: result.userId,
      email: result.email,
      role: result.role,
    } as any;
  }

  @GrpcMethod("AuthService", "GetTokenUser")
  async getTokenUser(data: any): Promise<GetTokenUserResponse> {
    this.logger.debug("gRPC GetTokenUser called");

    const result = await this.authService.validate(
      data.access_token || data.accessToken,
    );

    if (!result.valid) {
      return { userId: "", email: "", name: "", role: "" } as any;
    }

    return {
      userId: result.userId,
      email: result.email,
      name: "",
      role: result.role,
    } as any;
  }
}
