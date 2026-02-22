import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { ProxyService } from "../proxy.service";

@ApiTags("Questions")
@Controller("questions")
export class QuestionsController {
  private readonly questionUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.questionUrl = this.config.get<string>("microservices.question")!;
  }

  @Get()
  @ApiOperation({ summary: "Get paginated questions" })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "difficulty", required: false })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  async findAll(
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string,
    @Query("category") category?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    const query = new URLSearchParams();
    if (type) query.append("type", type);
    if (difficulty) query.append("difficulty", difficulty);
    if (category) query.append("category", category);
    if (page) query.append("page", page.toString());
    if (limit) query.append("limit", limit.toString());
    return this.proxy.forward(
      this.questionUrl,
      `/api/v1/questions?${query}`,
      "GET",
    );
  }

  @Get("random")
  @ApiOperation({ summary: "Get random questions" })
  async getRandom(
    @Query("type") type?: string,
    @Query("difficulty") difficulty?: string,
    @Query("count") count?: number,
  ) {
    const query = new URLSearchParams();
    if (type) query.append("type", type);
    if (difficulty) query.append("difficulty", difficulty);
    if (count) query.append("count", count.toString());
    return this.proxy.forward(
      this.questionUrl,
      `/api/v1/questions/random?${query}`,
      "GET",
    );
  }

  @Get("categories")
  @ApiOperation({ summary: "Get all categories" })
  async getCategories() {
    return this.proxy.forward(
      this.questionUrl,
      "/api/v1/questions/categories",
      "GET",
    );
  }

  @Get("tags")
  @ApiOperation({ summary: "Get all tags" })
  async getTags() {
    return this.proxy.forward(
      this.questionUrl,
      "/api/v1/questions/tags",
      "GET",
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get question by ID" })
  @ApiParam({ name: "id" })
  async findOne(@Param("id") id: string) {
    return this.proxy.forward(
      this.questionUrl,
      `/api/v1/questions/${id}`,
      "GET",
    );
  }

  @Post()
  @ApiOperation({ summary: "Create question (admin)" })
  async create(@Body() body: unknown) {
    return this.proxy.forward(
      this.questionUrl,
      "/api/v1/questions",
      "POST",
      body,
    );
  }

  @Post("generate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate questions using AI" })
  async generate(@Body() body: unknown) {
    return this.proxy.forward(
      this.questionUrl,
      "/api/v1/questions/generate",
      "POST",
      body,
    );
  }

  @Post("seed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Seed initial questions" })
  async seed() {
    return this.proxy.forward(
      this.questionUrl,
      "/api/v1/questions/seed",
      "POST",
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update question (admin)" })
  @ApiParam({ name: "id" })
  async update(@Param("id") id: string, @Body() body: unknown) {
    return this.proxy.forward(
      this.questionUrl,
      `/api/v1/questions/${id}`,
      "PATCH",
      body,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete question (admin)" })
  @ApiParam({ name: "id" })
  async delete(@Param("id") id: string) {
    return this.proxy.forward(
      this.questionUrl,
      `/api/v1/questions/${id}`,
      "DELETE",
    );
  }
}
