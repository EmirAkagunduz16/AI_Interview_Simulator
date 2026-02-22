import {
  Controller,
  Get,
  Patch,
  Req,
  Body,
  Inject,
  OnModuleInit,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_USER_SERVICE, IGrpcUserService } from "@ai-coach/grpc";

interface AuthenticatedRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags("Users")
@Controller("users")
export class UsersController implements OnModuleInit {
  private userService!: IGrpcUserService;

  constructor(
    @Inject(GRPC_USER_SERVICE) private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService =
      this.grpcClient.getService<IGrpcUserService>("UserService");
  }

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  async getMe(@Req() req: AuthenticatedRequest) {
    return firstValueFrom(
      this.userService.getUserByAuthId({
        auth_id: req.user.userId,
      }) as any,
    );
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  async updateMe(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return firstValueFrom(
      this.userService.updateUser({
        auth_id: req.user.userId,
        ...body,
      }) as any,
    );
  }

  @Get("me/stats")
  @ApiOperation({ summary: "Get user dashboard stats" })
  async getMyStats(@Req() req: AuthenticatedRequest) {
    const result: any = await firstValueFrom(
      this.userService.getUserStats({
        auth_id: req.user.userId,
      }) as any,
    );
    return JSON.parse(result.json_data);
  }

  @Get()
  @ApiOperation({ summary: "List all users" })
  async getUsers() {
    return firstValueFrom(
      this.userService.getUsers({ page: 1, limit: 50 }) as any,
    );
  }
}
