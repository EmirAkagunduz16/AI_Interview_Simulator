import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_db',
}));

export const serviceConfig = registerAs('service', () => ({
  port: parseInt(process.env.PORT || '3005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3003',
  questionServiceUrl: process.env.QUESTION_SERVICE_URL || 'http://localhost:3004',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:3006',
}));

export default () => ({
  database: databaseConfig(),
  service: serviceConfig(),
});
