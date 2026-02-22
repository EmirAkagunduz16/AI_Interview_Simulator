import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { GrpcClientsModule } from "./grpc-clients/grpc-clients.module";
import configuration from "./config/configuration";
import { ProxyModule } from "./proxy/proxy.module";
import { RoutesModule } from "./proxy/routes/routes.module";
import { HealthModule } from "./health/health.module";
import { JwtAuthGuard } from "./common/guards/auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
      cache: true,
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ── gRPC Clients ─────────────────────────────────────────
    GrpcClientsModule,

    // Core modules
    ProxyModule,
    RoutesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
