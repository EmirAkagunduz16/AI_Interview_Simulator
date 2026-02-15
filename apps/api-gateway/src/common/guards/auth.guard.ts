import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>("microservices.auth") ||
      process.env.AUTH_SERVICE_URL ||
      "http://localhost:3002";
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      throw new UnauthorizedException("Token bulunamadı");
    }

    try {
      const response = await axios.post(
        `${this.authServiceUrl}/api/v1/auth/validate`,
        {},
        {
          headers: { Authorization: authHeader },
          timeout: 5000,
        },
      );

      const { valid, userId, email, role } = response.data;

      if (!valid) {
        throw new UnauthorizedException("Token geçersiz");
      }

      // Attach user to request for downstream use
      request.user = { userId, email, role };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error("Auth validation failed", (error as Error).message);
      throw new UnauthorizedException("Kimlik doğrulama hatası");
    }
  }
}
