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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import {
  CreateUserInternalDto,
  UpdateUserDto,
  UserResponseDto,
  PaginatedUsersResponseDto,
} from "./dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiHeader({ name: "x-user-id", description: "User ID" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: "User not found" })
  async getMe(@Headers("x-user-id") authId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByAuthId(authId);
    return user.toJSON() as unknown as UserResponseDto;
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiHeader({ name: "x-user-id", description: "User ID" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: "User not found" })
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
  @ApiOperation({ summary: "[Internal] Create user" })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: "User already exists" })
  async createInternal(
    @Body() dto: CreateUserInternalDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.createInternal(dto);
    return user.toJSON() as unknown as UserResponseDto;
  }

  @Get("internal/:authId")
  @ApiOperation({ summary: "[Internal] Get user by auth ID" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: "User not found" })
  async getByAuthIdInternal(
    @Param("authId") authId: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByAuthIdSafe(authId);
    return user ? (user.toJSON() as unknown as UserResponseDto) : null;
  }

  @Get()
  @ApiOperation({ summary: "List all users" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedUsersResponseDto })
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
