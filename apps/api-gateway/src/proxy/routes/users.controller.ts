import {
  Controller,
  Get,
  Patch,
  Req,
  Body,
  Inject,
  OnModuleInit,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import {
  GRPC_USER_SERVICE,
  IGrpcUserService,
  UpdateUserRequest,
} from "@ai-coach/grpc";
import { AuthenticatedRequest } from "../../common/guards/auth.guard";

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
  async getMe(@Req() req: AuthenticatedRequest) {
    return firstValueFrom(
      this.userService.getUserByAuthId({ authId: req.user.userId }),
    );
  }

  @Patch("me")
  async updateMe(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: Omit<UpdateUserRequest, "authId">,
  ) {
    const payload: UpdateUserRequest = {
      authId: req.user.userId,
      ...body,
    };
    Object.keys(payload).forEach((key) => {
      const k = key as keyof UpdateUserRequest;
      if (payload[k] === undefined) delete payload[k];
    });

    return firstValueFrom(this.userService.updateUser(payload));
  }

  @Get("me/stats")
  async getMyStats(@Req() req: AuthenticatedRequest) {
    const result = await firstValueFrom(
      this.userService.getUserStats({ authId: req.user.userId }),
    );
    return JSON.parse(result.jsonData || "{}");
  }

  @Get()
  async getUsers() {
    return firstValueFrom(this.userService.getUsers({ page: 1, limit: 50 }));
  }
}
