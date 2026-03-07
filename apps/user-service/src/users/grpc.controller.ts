import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { UsersService } from "./users.service";
import type {
  GetUserByAuthIdRequest,
  GetUserByIdRequest,
  UpdateUserRequest,
  GetUserStatsRequest,
  GetUsersRequest,
  UserResponse,
  UsersListResponse,
  GetUserStatsResponse,
} from "@ai-coach/grpc";

@Controller()
export class GrpcUsersController {
  private readonly logger = new Logger(GrpcUsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod("UserService", "GetUserByAuthId")
  async getUserByAuthId(data: GetUserByAuthIdRequest): Promise<UserResponse> {
    this.logger.debug(`gRPC GetUserByAuthId: ${data.authId}`);
    const user = await this.usersService.findByAuthId(data.authId);
    return this.toGrpcResponse(user);
  }

  @GrpcMethod("UserService", "GetUserById")
  async getUserById(data: GetUserByIdRequest): Promise<UserResponse> {
    this.logger.debug(`gRPC GetUserById: ${data.userId}`);
    const user = await this.usersService.findById(data.userId);
    return this.toGrpcResponse(user);
  }

  @GrpcMethod("UserService", "UpdateUser")
  async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
    this.logger.debug(`gRPC UpdateUser: ${data.authId}`);
    const updateDto: Record<string, unknown> = {};
    if (data.name) updateDto.name = data.name;
    if (data.avatar) updateDto.avatar = data.avatar;
    if (data.bio) updateDto.bio = data.bio;
    if (data.targetRole) updateDto.targetRole = data.targetRole;
    if (data.experienceLevel) updateDto.experienceLevel = data.experienceLevel;
    if (data.skills?.length) updateDto.skills = data.skills;

    const user = await this.usersService.update(data.authId, updateDto);
    return this.toGrpcResponse(user);
  }

  @GrpcMethod("UserService", "GetUserStats")
  async getUserStats(data: GetUserStatsRequest): Promise<GetUserStatsResponse> {
    this.logger.debug(`gRPC GetUserStats: ${data.authId}`);
    const stats = await this.usersService.getDashboardStats(data.authId);
    return { jsonData: JSON.stringify(stats) };
  }

  @GrpcMethod("UserService", "GetUsers")
  async getUsers(data: GetUsersRequest): Promise<UsersListResponse> {
    this.logger.debug(`gRPC GetUsers page=${data.page}`);
    const result = await this.usersService.findAll({
      page: data.page || 1,
      limit: data.limit || 10,
    });
    return {
      users: result.users.map((u) => this.toGrpcResponse(u)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toGrpcResponse(user: { toJSON?: () => Record<string, any> } & Record<string, any>): UserResponse {
    const json = user.toJSON ? user.toJSON() : user;
    return {
      id: json._id?.toString() || json.id || "",
      authId: json.authId || "",
      email: json.email || "",
      name: json.name || "",
      role: json.role || "user",
      profile: {
        avatar: json.profile?.avatar || "",
        bio: json.profile?.bio || "",
        targetRole: json.profile?.targetRole || "",
        experienceLevel: json.profile?.experienceLevel || "",
        skills: json.profile?.skills || [],
      },
      subscription: {
        plan: json.subscription?.plan || "free",
        interviewsUsed: json.subscription?.interviewsUsed || 0,
        interviewsLimit: json.subscription?.interviewsLimit || 0,
      },
      isActive: json.isActive !== false,
    };
  }
}
