import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { UsersService } from "./users.service";

@Controller()
export class GrpcUsersController {
  private readonly logger = new Logger(GrpcUsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod("UserService", "GetUserByAuthId")
  async getUserByAuthId(data: { auth_id: string }) {
    this.logger.debug(`gRPC GetUserByAuthId: ${data.auth_id}`);
    const user = await this.usersService.findByAuthId(data.auth_id);
    return this.toGrpcResponse(user);
  }

  @GrpcMethod("UserService", "GetUserById")
  async getUserById(data: { user_id: string }) {
    this.logger.debug(`gRPC GetUserById: ${data.user_id}`);
    const user = await this.usersService.findById(data.user_id);
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
    this.logger.debug(`gRPC UpdateUser: ${data.auth_id}`);
    const updateDto: Record<string, unknown> = {};
    if (data.name) updateDto.name = data.name;
    if (data.avatar) updateDto.avatar = data.avatar;
    if (data.bio) updateDto.bio = data.bio;
    if (data.target_role) updateDto.targetRole = data.target_role;
    if (data.experience_level)
      updateDto.experienceLevel = data.experience_level;
    if (data.skills?.length) updateDto.skills = data.skills;

    const user = await this.usersService.update(data.auth_id, updateDto);
    return this.toGrpcResponse(user);
  }

  @GrpcMethod("UserService", "GetUserStats")
  async getUserStats(data: { auth_id: string }) {
    this.logger.debug(`gRPC GetUserStats: ${data.auth_id}`);
    const stats = await this.usersService.getDashboardStats(data.auth_id);
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
