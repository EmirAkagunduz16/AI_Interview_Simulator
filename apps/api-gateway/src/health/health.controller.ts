import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { Public } from "../common/decorators/public.decorator";

interface ServiceHealth {
  name: string;
  url: string;
  status: "healthy" | "unhealthy";
  responseTime?: number;
}

@ApiTags("Health")
@Controller("health")
@Public()
export class HealthController {
  private readonly startTime = Date.now();
  private readonly services: { name: string; url: string }[];

  constructor(private readonly config: ConfigService) {
    this.services = [
      { name: "user", url: this.config.get<string>("microservices.user")! },
      {
        name: "question",
        url: this.config.get<string>("microservices.question")!,
      },
      {
        name: "interview",
        url: this.config.get<string>("microservices.interview")!,
      },
      { name: "ai", url: this.config.get<string>("microservices.ai")! },
    ];
  }

  @Get()
  @ApiOperation({ summary: "Gateway health check" })
  getHealth() {
    return {
      status: "ok",
      service: "api-gateway",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get("services")
  @ApiOperation({ summary: "Check all services health" })
  async getServicesHealth(): Promise<{
    services: ServiceHealth[];
    healthy: number;
    total: number;
  }> {
    const results: ServiceHealth[] = await Promise.all(
      this.services.map(async ({ name, url }) => {
        const start = Date.now();
        try {
          await axios.get(`${url}/api/v1/health/live`, { timeout: 3000 });
          return {
            name,
            url,
            status: "healthy" as const,
            responseTime: Date.now() - start,
          };
        } catch {
          return {
            name,
            url,
            status: "unhealthy" as const,
          };
        }
      }),
    );

    const healthy = results.filter((r) => r.status === "healthy").length;

    return {
      services: results,
      healthy,
      total: results.length,
    };
  }

  @Get("live")
  @ApiOperation({ summary: "Liveness probe" })
  getLiveness() {
    return { status: "ok" };
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness probe" })
  getReadiness() {
    return { status: "ok", ready: true };
  }
}
