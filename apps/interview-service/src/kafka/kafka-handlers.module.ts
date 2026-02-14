import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { KafkaTopics, IKafkaEvent } from '@ai-coach/shared-types';
import { InterviewsService } from '../interviews/interviews.service';
import { InterviewsModule } from '../interviews/interviews.module';

interface IAiEvaluationCompletedPayload {
  interviewId: string;
  questionId: string;
  userId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

@Module({
  imports: [InterviewsModule],
})
export class KafkaHandlersModule implements OnModuleInit {
  private readonly logger = new Logger(KafkaHandlersModule.name);
  private consumer: Consumer | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly interviewsService: InterviewsService,
  ) {}

  async onModuleInit() {
    const brokers = this.configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];

    const kafka = new Kafka({
      clientId: 'interview-service-consumer',
      brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });

    this.consumer = kafka.consumer({ groupId: 'interview-service-handlers' });

    try {
      await this.consumer.connect();
      this.logger.log('Kafka consumer connected');

      // Subscribe to AI evaluation completed events
      await this.consumer.subscribe({ topic: KafkaTopics.AI_EVALUATION_COMPLETED, fromBeginning: false });
      this.logger.log(`Subscribed to: ${KafkaTopics.AI_EVALUATION_COMPLETED}`);

      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload) => this.handleMessage(payload),
      });
    } catch (error) {
      this.logger.error('Failed to initialize Kafka consumer', error);
    }
  }

  private async handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
    const value = message.value?.toString();
    if (!value) return;

    try {
      const event: IKafkaEvent = JSON.parse(value);
      this.logger.debug(`Received event: ${topic} (${event.eventId}) from ${event.source}`);

      switch (topic) {
        case KafkaTopics.AI_EVALUATION_COMPLETED:
          await this.handleAiEvaluationCompleted(event.payload as IAiEvaluationCompletedPayload, event.eventId);
          break;
        default:
          this.logger.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message on topic ${topic}`, error);
    }
  }

  private async handleAiEvaluationCompleted(
    payload: IAiEvaluationCompletedPayload,
    eventId: string,
  ): Promise<void> {
    this.logger.log(`Processing AI_EVALUATION_COMPLETED: ${eventId} for interview ${payload.interviewId}`);

    try {
      // Update the answer in the interview with AI feedback
      await this.interviewsService.updateAnswerWithAiFeedback(
        payload.interviewId,
        payload.questionId,
        {
          score: payload.score,
          feedback: payload.feedback,
          strengths: payload.strengths,
          improvements: payload.improvements,
        },
      );

      this.logger.log(`AI feedback saved for interview ${payload.interviewId}, question ${payload.questionId}`);
    } catch (error) {
      this.logger.error(`Failed to save AI feedback for interview ${payload.interviewId}`, error);
    }
  }
}
