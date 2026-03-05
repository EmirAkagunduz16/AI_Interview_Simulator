import { Controller, Post, Body, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { ProxyService } from "../proxy.service";
import { Public } from "../../common/decorators/public.decorator";

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
  async login(@Body() body: unknown) {
    return this.proxy.forward(this.authUrl, "/api/v1/auth/login", "POST", body);
  }

  @Post("refresh")
  @Public()
  async refresh(@Body() body: unknown) {
    return this.proxy.forward(
      this.authUrl,
      "/api/v1/auth/refresh",
      "POST",
      body,
    );
  }

  @Post("logout")
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
