import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { ProxyService } from "../proxy.service";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

@ApiTags("Interviews")
@Controller("interviews")
export class InterviewsController {
  private readonly interviewUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.interviewUrl = this.config.get<string>("microservices.interview")!;
  }

  @Get()
  @ApiOperation({ summary: "Get user interviews" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "status", required: false })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
  ) {
    const query = new URLSearchParams();
    if (page) query.append("page", page.toString());
    if (limit) query.append("limit", limit.toString());
    if (status) query.append("status", status);
    return this.proxy.forward(
      this.interviewUrl,
      `/api/v1/interviews?${query}`,
      "GET",
      null,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }

  @Get("stats")
  @ApiOperation({ summary: "Get interview statistics" })
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward(
      this.interviewUrl,
      "/api/v1/interviews/stats",
      "GET",
      null,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get interview by ID" })
  @ApiParam({ name: "id" })
  async findOne(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.proxy.forward(
      this.interviewUrl,
      `/api/v1/interviews/${id}`,
      "GET",
      null,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }

  @Post()
  @ApiOperation({ summary: "Create new interview" })
  async create(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.proxy.forward(
      this.interviewUrl,
      "/api/v1/interviews",
      "POST",
      body,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }

  @Post(":id/start")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Start interview" })
  @ApiParam({ name: "id" })
  async start(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.proxy.forward(
      this.interviewUrl,
      `/api/v1/interviews/${id}/start`,
      "POST",
      null,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }

  @Post(":id/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit answer" })
  @ApiParam({ name: "id" })
  async submitAnswer(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.proxy.forward(
      this.interviewUrl,
      `/api/v1/interviews/${id}/submit`,
      "POST",
      body,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete interview" })
  @ApiParam({ name: "id" })
  async complete(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.proxy.forward(
      this.interviewUrl,
      `/api/v1/interviews/${id}/complete`,
      "POST",
      null,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel interview" })
  @ApiParam({ name: "id" })
  async cancel(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.proxy.forward(
      this.interviewUrl,
      `/api/v1/interviews/${id}/cancel`,
      "POST",
      null,
      {
        headers: { "x-user-id": req.user!.userId },
      },
    );
  }
}
