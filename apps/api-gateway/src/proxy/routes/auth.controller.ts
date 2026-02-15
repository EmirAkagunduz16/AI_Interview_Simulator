import { Controller, Post, Body, Req } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { ProxyService } from "../proxy.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  private readonly authUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.authUrl = this.config.get<string>("microservices.auth")!;
  }

  @Post("register")
  @Public()
  @ApiOperation({ summary: "Register a new user" })
  async register(@Body() body: unknown) {
    return this.proxy.forward(
      this.authUrl,
      "/api/v1/auth/register",
      "POST",
      body,
    );
  }

  @Post("login")
  @Public()
  @ApiOperation({ summary: "Login with email and password" })
  async login(@Body() body: unknown) {
    return this.proxy.forward(this.authUrl, "/api/v1/auth/login", "POST", body);
  }

  @Post("refresh")
  @Public()
  @ApiOperation({ summary: "Refresh access token" })
  async refresh(@Body() body: unknown) {
    return this.proxy.forward(
      this.authUrl,
      "/api/v1/auth/refresh",
      "POST",
      body,
    );
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout" })
  async logout(@Req() req: Request) {
    return this.proxy.forward(
      this.authUrl,
      "/api/v1/auth/logout",
      "POST",
      null,
      {
        headers: { Authorization: req.headers["authorization"] || "" },
      },
    );
  }
}
