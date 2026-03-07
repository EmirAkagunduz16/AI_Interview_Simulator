import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/user_db',
}));

export const serviceConfig = registerAs('service', () => ({
  port: parseInt(process.env.PORT || '3003', 10),
  grpcPort: parseInt(process.env.GRPC_PORT || '50052', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}));

export default () => ({
  database: databaseConfig(),
  service: serviceConfig(),
});
