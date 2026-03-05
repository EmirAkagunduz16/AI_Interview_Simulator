import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Controller("health")
export class HealthController {
  private startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHealth() {
    const hasApiKey = !!this.configService.get("openai.apiKey");
    return {
      status: "ok",
      service: "ai-service",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      openai: { configured: hasApiKey },
    };
  }

  @Get("live")
  getLiveness() {
    return { status: "ok" };
  }

  @Get("ready")
  getReadiness() {
    const hasApiKey = !!this.configService.get("openai.apiKey");
    return { status: "ok", ready: hasApiKey };
  }
}
