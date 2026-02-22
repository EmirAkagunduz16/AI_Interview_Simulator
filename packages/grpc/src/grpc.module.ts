import { Module, DynamicModule, Provider } from "@nestjs/common";
import { ClientsModule, Transport, ClientGrpc } from "@nestjs/microservices";
import { join } from "path";
import {
  GrpcServiceOptions,
  GrpcModuleAsyncOptions,
} from "./interfaces/grpc.interfaces";

@Module({})
export class GrpcModule {
  /**
   * Register a gRPC client with static configuration.
   * Use this when URL is known at compile time.
   *
   * @example
   * GrpcModule.forClient({
   *   serviceName: GRPC_AUTH_SERVICE,
   *   packageName: PROTO_PACKAGES.AUTH,
   *   protoPath: GrpcModule.getProtoPath('auth.proto'),
   *   url: 'localhost:50051',
   * })
   */
  static forClient(options: GrpcServiceOptions): DynamicModule {
    return {
      module: GrpcModule,
      imports: [
        ClientsModule.register([
          {
            name: options.serviceName,
            transport: Transport.GRPC,
            options: {
              package: options.packageName,
              protoPath: options.protoPath,
              url: options.url,
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }

  /**
   * Register a gRPC client with async configuration.
   * Use this when URL comes from ConfigService.
   *
   * @example
   * GrpcModule.forClientAsync({
   *   serviceName: GRPC_AUTH_SERVICE,
   *   packageName: PROTO_PACKAGES.AUTH,
   *   protoPath: GrpcModule.getProtoPath('auth.proto'),
   *   useFactory: (config: ConfigService) => ({
   *     url: config.get('AUTH_GRPC_URL') || 'localhost:50051',
   *   }),
   *   inject: [ConfigService],
   * })
   */
  static forClientAsync(options: GrpcModuleAsyncOptions): DynamicModule {
    return {
      module: GrpcModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: options.serviceName,
            useFactory: async (...args: unknown[]) => {
              const result = await options.useFactory(...args);
              return {
                transport: Transport.GRPC,
                options: {
                  package: options.packageName,
                  protoPath: options.protoPath,
                  url: result.url,
                },
              };
            },
            inject: options.inject || [],
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }

  /**
   * Helper to resolve proto file paths from this package.
   *
   * @example
   * const protoPath = GrpcModule.getProtoPath('auth.proto');
   */
  static getProtoPath(filename: string): string {
    return join(__dirname, "proto", filename);
  }
}
