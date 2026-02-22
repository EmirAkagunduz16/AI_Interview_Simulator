import { Module, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Consumer, EachMessagePayload, logLevel } from "kafkajs";
import {
  KafkaTopics,
  IKafkaEvent,
  IAnswerSubmittedPayload,
} from "@ai-coach/shared-types";
import { KafkaProducerService } from "@ai-coach/kafka-client";
import { GeminiService } from "../ai/ai.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule],
})
export class KafkaHandlersModule implements OnModuleInit {
  private readonly logger = new Logger(KafkaHandlersModule.name);
  private consumer: Consumer | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async onModuleInit() {
    const brokers = this.configService
      .get<string>("KAFKA_BROKERS")
      ?.split(",") || ["localhost:9092"];

    const kafka = new Kafka({
      clientId: "ai-service-consumer",
      brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });

    this.consumer = kafka.consumer({ groupId: "ai-service-handlers" });

    try {
      await this.consumer.connect();
      this.logger.log("Kafka consumer connected");

      // Subscribe to answer submitted events for AI evaluation
      await this.consumer.subscribe({
        topic: KafkaTopics.INTERVIEW_ANSWER_SUBMITTED,
        fromBeginning: false,
      });
      this.logger.log(
        `Subscribed to: ${KafkaTopics.INTERVIEW_ANSWER_SUBMITTED}`,
      );

      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload) => this.handleMessage(payload),
      });
    } catch (error) {
      this.logger.error("Failed to initialize Kafka consumer", error);
    }
  }

  private async handleMessage({
    topic,
    message,
  }: EachMessagePayload): Promise<void> {
    const value = message.value?.toString();
    if (!value) return;

    try {
      const event: IKafkaEvent = JSON.parse(value);
      this.logger.debug(
        `Received event: ${topic} (${event.eventId}) from ${event.source}`,
      );

      switch (topic) {
        case KafkaTopics.INTERVIEW_ANSWER_SUBMITTED:
          await this.handleAnswerSubmitted(
            event.payload as IAnswerSubmittedPayload,
            event.eventId,
          );
          break;
        default:
          this.logger.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message on topic ${topic}`, error);
    }
  }

  private async handleAnswerSubmitted(
    payload: IAnswerSubmittedPayload,
    eventId: string,
  ): Promise<void> {
    this.logger.log(
      `Processing INTERVIEW_ANSWER_SUBMITTED: ${eventId} for interview ${payload.interviewId}`,
    );

    try {
      // Use Gemini to evaluate the single answer
      const evaluation = await this.geminiService.evaluateInterview({
        field: "general",
        techStack: [],
        answers: [
          {
            question: payload.questionTitle || payload.questionContent,
            answer: payload.answer,
            order: 1,
          },
        ],
      });

      // Extract the single question evaluation
      const questionEval = evaluation.questionEvaluations?.[0];

      // Emit AI_EVALUATION_COMPLETED event back to Kafka
      await this.kafkaProducer.emit(
        KafkaTopics.AI_EVALUATION_COMPLETED,
        {
          interviewId: payload.interviewId,
          questionId: payload.questionId,
          userId: payload.userId,
          score: questionEval?.score ?? evaluation.overallScore,
          feedback: questionEval?.feedback ?? evaluation.summary,
          strengths: questionEval?.strengths ?? [],
          improvements: questionEval?.improvements ?? [],
        },
        { correlationId: eventId },
      );

      this.logger.log(
        `AI evaluation completed for interview ${payload.interviewId}, question ${payload.questionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to evaluate answer for interview ${payload.interviewId}`,
        error,
      );
    }
  }
}
