import { Controller, Get, Req, Inject, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { GRPC_USER_SERVICE, IGrpcUserService } from "@ai-coach/grpc";
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
}
