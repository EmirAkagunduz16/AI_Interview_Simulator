import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    const dbState = this.connection.readyState;
    return {
      status: dbState === 1 ? 'ok' : 'error',
      service: 'question-service',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      database: { status: dbState === 1 ? 'connected' : 'disconnected' },
    };
  }

  @Get('live')
  getLiveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  getReadiness() {
    const isReady = this.connection.readyState === 1;
    return { status: isReady ? 'ok' : 'error', ready: isReady };
  }
}
