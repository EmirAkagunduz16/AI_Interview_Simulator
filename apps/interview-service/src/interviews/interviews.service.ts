import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { KafkaTopics } from "@ai-coach/shared-types";
import { KafkaProducerService } from "@ai-coach/kafka-client";
import { InterviewRepository } from "./repositories/interview.repository";
import { CreateInterviewDto, SubmitAnswerDto, InterviewStatsDto } from "./dto";
import {
  InterviewDocument,
  InterviewStatus,
  InterviewType,
  InterviewAnswer,
} from "./entities/interview.entity";
import {
  InterviewNotFoundException,
  InterviewAlreadyStartedException,
  InterviewNotStartedException,
  InterviewAlreadyCompletedException,
} from "../common/exceptions";

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);
  private readonly userServiceUrl: string;
  private readonly questionServiceUrl: string;
  private readonly aiServiceUrl: string;

  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly configService: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    this.userServiceUrl = this.configService.get<string>(
      "service.userServiceUrl",
    )!;
    this.questionServiceUrl = this.configService.get<string>(
      "service.questionServiceUrl",
    )!;
    this.aiServiceUrl = this.configService.get<string>("service.aiServiceUrl")!;
  }

  async create(
    userId: string,
    dto: CreateInterviewDto,
  ): Promise<InterviewDocument> {
    this.logger.log(`Creating interview for user: ${userId}`);

    // Get random questions
    const questionCount = dto.questionCount || 5;
    const questions = await this.getRandomQuestions(
      dto.type,
      dto.difficulty,
      questionCount,
    );
    const questionIds = questions.map((q: { id: string }) => q.id);

    const interview = await this.interviewRepository.create({
      userId,
      title: dto.title || `Interview - ${new Date().toLocaleDateString()}`,
      type: dto.type || InterviewType.MIXED,
      targetRole: dto.targetRole,
      difficulty: dto.difficulty,
      durationMinutes: dto.durationMinutes || 30,
      questionIds,
    });

    // Emit Kafka event for interview started
    await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_STARTED, {
      interviewId: interview._id.toString(),
      userId,
      type: interview.type,
      targetRole: interview.targetRole,
      questionCount: questionIds.length,
    });

    this.logger.log(`Interview created: ${interview._id}`);
    return interview;
  }

  async findById(userId: string, id: string): Promise<InterviewDocument> {
    const interview = await this.interviewRepository.findByUserIdAndId(
      userId,
      id,
    );
    if (!interview) {
      throw new InterviewNotFoundException(id);
    }
    return interview;
  }

  async findByUserId(
    userId: string,
    options: { page?: number; limit?: number; status?: InterviewStatus } = {},
  ): Promise<{
    interviews: InterviewDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = options;
    const { interviews, total } = await this.interviewRepository.findByUserId(
      userId,
      options,
    );
    return { interviews, total, page, totalPages: Math.ceil(total / limit) };
  }

  async start(userId: string, id: string): Promise<InterviewDocument> {
    const interview = await this.findById(userId, id);

    if (interview.status !== InterviewStatus.PENDING) {
      throw new InterviewAlreadyStartedException();
    }

    const updated = await this.interviewRepository.updateStatus(
      id,
      InterviewStatus.IN_PROGRESS,
    );
    this.logger.log(`Interview started: ${id}`);
    return updated!;
  }

  async submitAnswer(
    userId: string,
    id: string,
    dto: SubmitAnswerDto,
  ): Promise<InterviewDocument> {
    const interview = await this.findById(userId, id);

    if (interview.status === InterviewStatus.PENDING) {
      throw new InterviewNotStartedException();
    }
    if (interview.status === InterviewStatus.COMPLETED) {
      throw new InterviewAlreadyCompletedException();
    }

    // Get question details
    const question = await this.getQuestion(dto.questionId);

    // Get AI evaluation (async, don't wait)
    const answer: InterviewAnswer = {
      questionId: dto.questionId,
      questionTitle: question?.title || "Unknown Question",
      answer: dto.answer,
      answeredAt: new Date(),
    };

    const updated = await this.interviewRepository.addAnswer(id, answer);

    // Emit Kafka event for answer submitted - AI service will consume this
    await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_ANSWER_SUBMITTED, {
      interviewId: id,
      userId,
      questionId: dto.questionId,
      questionTitle: question?.title || "Unknown",
      questionContent: question?.content || "",
      answer: dto.answer,
    });

    return updated!;
  }

  async complete(userId: string, id: string): Promise<InterviewDocument> {
    const interview = await this.findById(userId, id);

    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      throw new InterviewNotStartedException();
    }

    // Calculate total score from answers
    const scores = interview.answers
      .filter((a) => a.score !== undefined)
      .map((a) => a.score as number);
    const totalScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;

    const overallFeedback = this.generateOverallFeedback(
      totalScore,
      interview.answers.length,
    );

    const updated = await this.interviewRepository.setCompletion(
      id,
      totalScore,
      overallFeedback,
    );

    // Emit Kafka event for interview completed
    await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_COMPLETED, {
      interviewId: id,
      userId,
      score: totalScore,
      questionsAnswered: interview.answers.length,
      duration: interview.durationMinutes,
    });

    this.logger.log(`Interview completed: ${id}, score: ${totalScore}`);
    return updated!;
  }

  async cancel(userId: string, id: string): Promise<InterviewDocument> {
    const interview = await this.findById(userId, id);

    if (interview.status === InterviewStatus.COMPLETED) {
      throw new InterviewAlreadyCompletedException();
    }

    const updated = await this.interviewRepository.updateStatus(
      id,
      InterviewStatus.CANCELLED,
    );
    this.logger.log(`Interview cancelled: ${id}`);
    return updated!;
  }

  async getStats(userId: string): Promise<InterviewStatsDto> {
    return this.interviewRepository.getStats(userId);
  }

  private async getRandomQuestions(
    type?: InterviewType,
    difficulty?: string,
    count = 5,
  ): Promise<{ id: string; title: string }[]> {
    try {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (difficulty) params.append("difficulty", difficulty);
      params.append("count", count.toString());

      const response = await axios.get(
        `${this.questionServiceUrl}/api/v1/questions/random?${params.toString()}`,
        { timeout: 5000 },
      );
      return response.data;
    } catch (error) {
      this.logger.warn("Failed to get questions, using defaults");
      return [];
    }
  }

  private async getQuestion(
    questionId: string,
  ): Promise<{ title: string; content: string } | null> {
    try {
      const response = await axios.get(
        `${this.questionServiceUrl}/api/v1/questions/${questionId}`,
        { timeout: 5000 },
      );
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Update answer with AI feedback received from Kafka event
   */
  async updateAnswerWithAiFeedback(
    interviewId: string,
    questionId: string,
    feedback: {
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    },
  ): Promise<void> {
    await this.interviewRepository.updateAnswer(interviewId, questionId, {
      feedback: feedback.feedback,
      score: feedback.score,
      suggestions: feedback.improvements,
      evaluatedAt: new Date(),
    } as InterviewAnswer);

    this.logger.log(
      `Answer updated with AI feedback: ${interviewId}/${questionId}`,
    );
  }

  private generateOverallFeedback(
    score: number,
    questionCount: number,
  ): string {
    if (score >= 80) {
      return `Excellent performance! You answered ${questionCount} questions with an average score of ${score}%. Keep up the great work!`;
    } else if (score >= 60) {
      return `Good job! You scored ${score}% on ${questionCount} questions. Review the feedback to improve further.`;
    } else {
      return `You completed ${questionCount} questions with a ${score}% score. Consider practicing more and reviewing the suggestions.`;
    }
  }
}
