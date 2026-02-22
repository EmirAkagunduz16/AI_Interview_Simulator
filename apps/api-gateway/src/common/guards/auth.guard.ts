import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
  OnModuleInit,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_AUTH_SERVICE, IGrpcAuthService } from "@ai-coach/grpc";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private authService!: IGrpcAuthService;

  constructor(
    private readonly reflector: Reflector,
    @Inject(GRPC_AUTH_SERVICE) private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService =
      this.grpcClient.getService<IGrpcAuthService>("AuthService");
    this.logger.log("gRPC AuthService client initialized");
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

    const token = authHeader.replace("Bearer ", "");

    try {
      const result = await firstValueFrom<{
        valid: boolean;
        user_id: string;
        email: string;
        role: string;
      }>(
        (this.authService as any).validateToken({
          accessToken: token,
        }),
      );

      require("fs").appendFileSync(
        "gateway-debug.log",
        "Validation Result Dump: " + JSON.stringify(result) + "\n",
      );

      if (!result.valid) {
        throw new UnauthorizedException("Token geçersiz");
      }

      // Attach user to request for downstream use
      request.user = {
        userId: result.user_id || (result as any).userId,
        email: result.email,
        role: result.role,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        "gRPC auth validation failed",
        (error as Error).message,
      );
      throw new UnauthorizedException("Kimlik doğrulama hatası");
    }
  }
}
