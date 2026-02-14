import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    const hasApiKey = !!this.configService.get<string>('openai.apiKey');
    return {
      status: 'ok',
      service: 'ai-service',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      openai: { configured: hasApiKey },
    };
  }

  @Get('live')
  getLiveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  getReadiness() {
    const hasApiKey = !!this.configService.get<string>('openai.apiKey');
    return { status: 'ok', ready: hasApiKey };
  }
}
