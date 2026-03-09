import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { AuthService } from "./auth.service";
import type {
  ValidateTokenRequest,
  ValidateTokenResponse,
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  LogoutRequest,
  TokenResponse,
  LogoutResponse,
} from "@ai-coach/grpc";

@Controller()
export class GrpcAuthController {
  private readonly logger = new Logger(GrpcAuthController.name);

  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("AuthService", "ValidateToken")
  async validateToken(
    data: ValidateTokenRequest,
  ): Promise<ValidateTokenResponse> {
    this.logger.debug("gRPC ValidateToken called");
    const result = await this.authService.validate(data.accessToken);
    return {
      valid: result.valid,
      userId: result.userId,
      email: result.email,
      role: result.role,
    };
  }

  @GrpcMethod("AuthService", "Register")
  async register(data: RegisterRequest): Promise<TokenResponse> {
    this.logger.debug(`gRPC Register: ${data.email}`);
    const result = await this.authService.register({
      email: data.email,
      password: data.password,
      name: data.name,
    });
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: { ...result.user, name: result.user.name || "" },
    };
  }

  @GrpcMethod("AuthService", "Login")
  async login(data: LoginRequest): Promise<TokenResponse> {
    this.logger.debug(`gRPC Login: ${data.email}`);
    const result = await this.authService.login({
      email: data.email,
      password: data.password,
    });
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: { ...result.user, name: result.user.name || "" },
    };
  }

  @GrpcMethod("AuthService", "Refresh")
  async refresh(data: RefreshRequest): Promise<TokenResponse> {
    this.logger.debug("gRPC Refresh called");
    const result = await this.authService.refresh(data.refreshToken);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: { ...result.user, name: result.user.name || "" },
    };
  }

  @GrpcMethod("AuthService", "Logout")
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    this.logger.debug("gRPC Logout called");
    await this.authService.logout(data.accessToken);
    return { message: "Çıkış yapıldı" };
  }
}
