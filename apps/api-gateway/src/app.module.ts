import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { GrpcModule, GRPC_AUTH_SERVICE, PROTO_PACKAGES } from "@ai-coach/grpc";
import configuration from "./config/configuration";
import { ProxyModule } from "./proxy/proxy.module";
import { RoutesModule } from "./proxy/routes/routes.module";
import { HealthModule } from "./health/health.module";
import { JwtAuthGuard } from "./common/guards/auth.guard";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // gRPC: Auth service client (for auth guard)
    GrpcModule.forClientAsync({
      serviceName: GRPC_AUTH_SERVICE,
      packageName: PROTO_PACKAGES.AUTH,
      protoPath: GrpcModule.getProtoPath("auth.proto"),
      useFactory: (config: ConfigService) => ({
        url: config.get<string>("microservices.authGrpc") || "localhost:50051",
      }),
      inject: [ConfigService],
    }),

    // Core modules
    ProxyModule,
    RoutesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
