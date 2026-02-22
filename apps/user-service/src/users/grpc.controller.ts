import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { UsersService } from "./users.service";

@Controller()
export class GrpcUsersController {
  private readonly logger = new Logger(GrpcUsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod("UserService", "GetUserByAuthId")
  async getUserByAuthId(data: { auth_id: string }) {
    try {
      const authId = data.auth_id || (data as any).authId;
      this.logger.debug(`gRPC GetUserByAuthId: ${authId}`);
      const user = await this.usersService.findByAuthId(authId);
      return this.toGrpcResponse(user);
    } catch (error: any) {
      require("fs").appendFileSync(
        "user-debug.log",
        `Error in GetUserByAuthId: ${error.message}\n${error.stack}\n`,
      );
      throw error;
    }
  }

  @GrpcMethod("UserService", "GetUserById")
  async getUserById(data: { user_id: string }) {
    const userId = data.user_id || (data as any).userId;
    this.logger.debug(`gRPC GetUserById: ${userId}`);
    const user = await this.usersService.findById(userId);
    return this.toGrpcResponse(user);
  }

  @GrpcMethod("UserService", "UpdateUser")
  async updateUser(data: {
    auth_id: string;
    name?: string;
    avatar?: string;
    bio?: string;
    target_role?: string;
    experience_level?: string;
    skills?: string[];
  }) {
    const authId = data.auth_id || (data as any).authId;
    this.logger.debug(`gRPC UpdateUser: ${authId}`);
    const updateDto: Record<string, unknown> = {};
    if (data.name) updateDto.name = data.name;
    if (data.avatar) updateDto.avatar = data.avatar;
    if (data.bio) updateDto.bio = data.bio;
    if (data.target_role || (data as any).targetRole)
      updateDto.targetRole = data.target_role || (data as any).targetRole;
    if (data.experience_level || (data as any).experienceLevel)
      updateDto.experienceLevel =
        data.experience_level || (data as any).experienceLevel;
    if (data.skills?.length) updateDto.skills = data.skills;

    const user = await this.usersService.update(authId, updateDto);
    return this.toGrpcResponse(user);
  }

  @GrpcMethod("UserService", "GetUserStats")
  async getUserStats(data: { auth_id: string }) {
    const authId = data.auth_id || (data as any).authId;
    this.logger.debug(`gRPC GetUserStats: ${authId}`);
    const stats = await this.usersService.getDashboardStats(authId);
    return { json_data: JSON.stringify(stats) };
  }

  @GrpcMethod("UserService", "GetUsers")
  async getUsers(data: { page: number; limit: number }) {
    this.logger.debug(`gRPC GetUsers page=${data.page}`);
    const result = await this.usersService.findAll({
      page: data.page || 1,
      limit: data.limit || 10,
    });
    return {
      users: result.users.map((u) => this.toGrpcResponse(u)),
      total: result.total,
      page: result.page,
      total_pages: result.totalPages,
    };
  }

  private toGrpcResponse(user: any) {
    const json = user.toJSON ? user.toJSON() : user;
    return {
      id: json._id?.toString() || json.id || "",
      auth_id: json.authId || "",
      email: json.email || "",
      name: json.name || "",
      role: json.role || "user",
      profile: {
        avatar: json.profile?.avatar || "",
        bio: json.profile?.bio || "",
        target_role: json.profile?.targetRole || "",
        experience_level: json.profile?.experienceLevel || "",
        skills: json.profile?.skills || [],
      },
      subscription: {
        plan: json.subscription?.plan || "free",
        interviews_used: json.subscription?.interviewsUsed || 0,
        interviews_limit: json.subscription?.interviewsLimit || 0,
      },
      is_active: json.isActive !== false,
    };
  }
}
