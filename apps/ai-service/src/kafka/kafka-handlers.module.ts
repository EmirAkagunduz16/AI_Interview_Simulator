import { Module, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Kafka,
  Consumer,
  Producer,
  EachMessagePayload,
  logLevel,
  Partitioners,
} from "kafkajs";
import { KafkaTopics, IKafkaEvent } from "@ai-coach/shared-types";
import { GeminiService } from "../ai/ai.service";
import { SupabaseService } from "../ai/supabase.service";
import { AiModule } from "../ai/ai.module";
import { v4 as uuidv4 } from "uuid";

interface IAnswerSubmittedPayload {
  interviewId: string;
  userId: string;
  questionId: string;
  questionTitle: string;
  questionContent: string;
  answer: string;
}

@Module({
  imports: [AiModule],
})
export class KafkaHandlersModule implements OnModuleInit {
  private readonly logger = new Logger(KafkaHandlersModule.name);
  private consumer: Consumer | null = null;
  private producer: Producer | null = null;
  private kafka: Kafka | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async onModuleInit() {
    const brokers = this.configService
      .get<string>("KAFKA_BROKERS")
      ?.split(",") || ["localhost:9092"];

    this.kafka = new Kafka({
      clientId: "ai-service-handler",
      brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });

    // Initialize producer for sending evaluation results
    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
      allowAutoTopicCreation: true,
    });

    // Initialize consumer for receiving answers to evaluate
    this.consumer = this.kafka.consumer({ groupId: "ai-service-evaluator" });

    try {
      await this.producer.connect();
      this.logger.log("Kafka producer connected");

      await this.consumer.connect();
      this.logger.log("Kafka consumer connected");

      // Subscribe to answer submitted events
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
      this.logger.error("Failed to initialize Kafka", error);
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
      this.logger.log(
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
    correlationId: string,
  ): Promise<void> {
    this.logger.log(
      `Evaluating answer for interview ${payload.interviewId}, question ${payload.questionId}`,
    );

    try {
      // Use Gemini to evaluate a single answer via the full interview evaluation
      const evaluation = await this.geminiService.evaluateInterview({
        field: "general",
        techStack: [],
        answers: [
          {
            question: payload.questionContent,
            answer: payload.answer,
            order: 1,
          },
        ],
      });

      const qEval = evaluation.questionEvaluations?.[0];

      // Emit evaluation completed event
      await this.emitEvaluationCompleted(
        {
          interviewId: payload.interviewId,
          questionId: payload.questionId,
          userId: payload.userId,
          score: qEval?.score || evaluation.overallScore,
          feedback: qEval?.feedback || evaluation.summary,
          strengths: qEval?.strengths || [],
          improvements: qEval?.improvements || [],
        },
        correlationId,
      );

      this.logger.log(
        `Evaluation completed for interview ${payload.interviewId}, question ${payload.questionId}, score: ${qEval?.score || evaluation.overallScore}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to evaluate answer for interview ${payload.interviewId}`,
        error,
      );
    }
  }

  private async emitEvaluationCompleted(
    payload: {
      interviewId: string;
      questionId: string;
      userId: string;
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    },
    correlationId: string,
  ): Promise<void> {
    if (!this.producer) {
      this.logger.error("Producer not initialized");
      return;
    }

    const eventId = uuidv4();
    const event: IKafkaEvent = {
      eventId,
      eventType: KafkaTopics.AI_EVALUATION_COMPLETED,
      timestamp: new Date().toISOString(),
      source: "ai-service",
      correlationId,
      payload,
    };

    await this.producer.send({
      topic: KafkaTopics.AI_EVALUATION_COMPLETED,
      messages: [
        {
          key: payload.interviewId,
          value: JSON.stringify(event),
          headers: {
            "event-id": eventId,
            "event-type": KafkaTopics.AI_EVALUATION_COMPLETED,
            source: "ai-service",
            "correlation-id": correlationId,
          },
        },
      ],
    });

    this.logger.debug(`Emitted AI_EVALUATION_COMPLETED: ${eventId}`);
  }
}
