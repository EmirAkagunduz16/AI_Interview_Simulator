import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import {
  CreateUserInternalDto,
  UpdateUserDto,
  UserResponseDto,
  PaginatedUsersResponseDto,
} from "./dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me/stats")
  async getMyStats(@Headers("x-user-id") authId: string) {
    return this.usersService.getDashboardStats(authId);
  }

  @Get("me")
  async getMe(@Headers("x-user-id") authId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByAuthId(authId);
    return user.toJSON() as unknown as UserResponseDto;
  }

  @Patch("me")
  async updateMe(
    @Headers("x-user-id") authId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(authId, dto);
    return user.toJSON() as unknown as UserResponseDto;
  }

  // ==================== Internal Endpoints ====================

  @Post("internal/create")
  @HttpCode(HttpStatus.CREATED)
  async createInternal(
    @Body() dto: CreateUserInternalDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.createInternal(dto);
    return user.toJSON() as unknown as UserResponseDto;
  }

  @Get("internal/:authId")
  async getByAuthIdInternal(
    @Param("authId") authId: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByAuthIdSafe(authId);
    return user ? (user.toJSON() as unknown as UserResponseDto) : null;
  }

  @Get()
  async findAll(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ): Promise<PaginatedUsersResponseDto> {
    const result = await this.usersService.findAll({ page, limit });
    return {
      users: result.users.map((u) => u.toJSON() as unknown as UserResponseDto),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }
}
