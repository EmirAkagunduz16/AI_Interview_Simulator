import {
  Controller,
  Post,
  Body,
  Req,
  Inject,
  OnModuleInit,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { Request } from "express";
import { firstValueFrom } from "rxjs";
import { GRPC_AUTH_SERVICE, IGrpcAuthService } from "@ai-coach/grpc";
import { Public } from "../../common/decorators/public.decorator";

@Controller("auth")
export class AuthController implements OnModuleInit {
  private authService!: IGrpcAuthService;

  constructor(
    @Inject(GRPC_AUTH_SERVICE) private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService =
      this.grpcClient.getService<IGrpcAuthService>("AuthService");
  }

  @Post("register")
  @Public()
  async register(
    @Body() body: { email: string; password: string; name: string },
  ) {
    const result = await firstValueFrom(
      this.authService.register({
        email: body.email,
        password: body.password,
        name: body.name,
      }),
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Post("login")
  @Public()
  async login(@Body() body: { email: string; password: string }) {
    const result = await firstValueFrom(
      this.authService.login({
        email: body.email,
        password: body.password,
      }),
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Post("refresh")
  @Public()
  async refresh(@Body() body: { refreshToken: string }) {
    const result = await firstValueFrom(
      this.authService.refresh({
        refreshToken: body.refreshToken,
      }),
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Post("logout")
  async logout(@Req() req: Request) {
    const token = req.headers["authorization"]?.replace("Bearer ", "") || "";
    return firstValueFrom(
      this.authService.logout({ accessToken: token }),
    );
  }
}
