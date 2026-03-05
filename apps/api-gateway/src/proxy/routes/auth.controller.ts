import {
  Controller,
  Post,
  Body,
  Req,
  Inject,
  OnModuleInit,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
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
    const result: any = await firstValueFrom(
      (this.authService as any).register({
        email: body.email,
        password: body.password,
        name: body.name,
      }),
    );
    return {
      accessToken: result.access_token || result.accessToken,
      refreshToken: result.refresh_token || result.refreshToken,
      user: result.user,
    };
  }

  @Post("login")
  @Public()
  async login(@Body() body: { email: string; password: string }) {
    const result: any = await firstValueFrom(
      (this.authService as any).login({
        email: body.email,
        password: body.password,
      }),
    );
    return {
      accessToken: result.access_token || result.accessToken,
      refreshToken: result.refresh_token || result.refreshToken,
      user: result.user,
    };
  }

  @Post("refresh")
  @Public()
  async refresh(@Body() body: { refreshToken: string }) {
    const result: any = await firstValueFrom(
      (this.authService as any).refresh({
        refreshToken: body.refreshToken,
      }),
    );
    return {
      accessToken: result.access_token || result.accessToken,
      refreshToken: result.refresh_token || result.refreshToken,
      user: result.user,
    };
  }

  @Post("logout")
  async logout(@Req() req: any) {
    const token = req.headers["authorization"]?.replace("Bearer ", "") || "";
    return firstValueFrom(
      (this.authService as any).logout({
        accessToken: token,
      }),
    );
  }
}
