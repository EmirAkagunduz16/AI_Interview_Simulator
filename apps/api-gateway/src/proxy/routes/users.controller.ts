import { Controller, Get, Patch, Body, Req, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { ProxyService } from "../proxy.service";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

@ApiTags("Users")
@Controller("users")
export class UsersController {
  private readonly userUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.userUrl = this.config.get<string>("microservices.user")!;
  }

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward(this.userUrl, "/api/v1/users/me", "GET", null, {
      headers: { "x-user-id": req.user!.userId },
    });
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  async updateMe(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.proxy.forward(this.userUrl, "/api/v1/users/me", "PATCH", body, {
      headers: { "x-user-id": req.user!.userId },
    });
  }

  @Get("me/can-interview")
  @ApiOperation({ summary: "Check if user can start interview" })
  async canInterview(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward(
      this.userUrl,
      "/api/v1/users/me/can-interview",
      "GET",
      null,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }

  @Get()
  @ApiOperation({ summary: "List all users (admin)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  async findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    const query = new URLSearchParams();
    if (page) query.append("page", page.toString());
    if (limit) query.append("limit", limit.toString());
    return this.proxy.forward(this.userUrl, `/api/v1/users?${query}`, "GET");
  }
}
