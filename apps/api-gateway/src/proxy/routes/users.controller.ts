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
      (this.userService as any).getUserByAuthId({
        authId: req.user.userId,
      }),
    );
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  async updateMe(@Req() req: AuthenticatedRequest, @Body() body: any) {
    // Convert generic body fields to what gRPC expects (camelCase)
    const payload = {
      authId: req.user.userId,
      name: body.name,
      avatar: body.avatar,
      bio: body.bio,
      targetRole: body.target_role || body.targetRole,
      experienceLevel: body.experience_level || body.experienceLevel,
      skills: body.skills,
    };
    // Remove undefined properties
    Object.keys(payload).forEach(
      (key) =>
        payload[key as keyof typeof payload] === undefined &&
        delete payload[key as keyof typeof payload],
    );

    return firstValueFrom((this.userService as any).updateUser(payload));
  }

  @Get("me/stats")
  @ApiOperation({ summary: "Get user dashboard stats" })
  async getMyStats(@Req() req: AuthenticatedRequest) {
    const result: any = await firstValueFrom(
      (this.userService as any).getUserStats({
        authId: req.user.userId,
      }),
    );
    return JSON.parse(result.json_data || result.jsonData || "{}");
  }

  @Get()
  @ApiOperation({ summary: "List all users" })
  async getUsers() {
    return firstValueFrom(
      this.userService.getUsers({ page: 1, limit: 50 }) as any,
    );
  }
}
