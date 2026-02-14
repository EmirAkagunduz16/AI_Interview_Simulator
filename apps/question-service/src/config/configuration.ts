import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/question_db',
}));

export const serviceConfig = registerAs('service', () => ({
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}));

export default () => ({
  database: databaseConfig(),
  service: serviceConfig(),
});
