import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { AuthService } from "./auth.service";

@Controller()
export class GrpcAuthController {
  private readonly logger = new Logger(GrpcAuthController.name);

  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("AuthService", "ValidateToken")
  async validateToken(data: any) {
    this.logger.debug("gRPC ValidateToken called");
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
  async getTokenUser(data: any) {
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

  @GrpcMethod("AuthService", "Register")
  async register(data: { email: string; password: string; name: string }) {
    this.logger.debug(`gRPC Register: ${data.email}`);
    const result = await this.authService.register({
      email: data.email,
      password: data.password,
      name: data.name,
    });
    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: result.user,
    };
  }

  @GrpcMethod("AuthService", "Login")
  async login(data: { email: string; password: string }) {
    this.logger.debug(`gRPC Login: ${data.email}`);
    const result = await this.authService.login({
      email: data.email,
      password: data.password,
    });
    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: result.user,
    };
  }

  @GrpcMethod("AuthService", "Refresh")
  async refresh(data: { refresh_token: string }) {
    this.logger.debug("gRPC Refresh called");
    const refreshToken = data.refresh_token || (data as any).refreshToken;
    const result = await this.authService.refresh(refreshToken);
    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: result.user,
    };
  }

  @GrpcMethod("AuthService", "Logout")
  async logout(data: { access_token: string }) {
    this.logger.debug("gRPC Logout called");
    const token = data.access_token || (data as any).accessToken;
    await this.authService.logout(token);
    return { message: "Çıkış yapıldı" };
  }
}
