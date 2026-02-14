import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KafkaTopics } from "@ai-coach/shared-types";
import { KafkaProducerService } from "@ai-coach/kafka-client";
import { InterviewRepository } from "./repositories/interview.repository";
import { CreateInterviewDto, SubmitAnswerDto, InterviewStatsDto } from "./dto";
import {
  InterviewDocument,
  InterviewStatus,
  InterviewAnswer,
  InterviewReport,
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

  constructor(
    private readonly interviewRepository: InterviewRepository,
    private readonly configService: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async create(
    userId: string,
    dto: CreateInterviewDto,
  ): Promise<InterviewDocument> {
    const interview = await this.interviewRepository.create({
      userId,
      field: dto.field,
      techStack: dto.techStack,
      difficulty: dto.difficulty || "intermediate",
      title: dto.title || `${dto.field} Mülakat`,
      type: dto.type,
      targetRole: dto.targetRole,
      durationMinutes: dto.durationMinutes || 30,
      vapiCallId: dto.vapiCallId,
      status: InterviewStatus.PENDING,
    });

    this.logger.log(`Interview created: ${interview._id} for user: ${userId}`);

    // Emit Kafka event
    try {
      await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_CREATED, {
        interviewId: interview._id.toString(),
        userId,
        field: dto.field,
        questionCount: dto.questionCount || 5,
      });
    } catch (error) {
      this.logger.warn("Failed to emit INTERVIEW_CREATED event", error);
    }

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

  async findByIdInternal(id: string): Promise<InterviewDocument> {
    const interview = await this.interviewRepository.findById(id);
    if (!interview) {
      throw new InterviewNotFoundException(id);
    }
    return interview;
  }

  async findByVapiCallId(
    vapiCallId: string,
  ): Promise<InterviewDocument | null> {
    return this.interviewRepository.findByVapiCallId(vapiCallId);
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
    const page = options.page || 1;
    const limit = options.limit || 10;

    const result = await this.interviewRepository.findByUserId(userId, {
      page,
      limit,
      status: options.status,
    });

    return {
      ...result,
      page,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async start(userId: string, id: string): Promise<InterviewDocument> {
    const interview = await this.findById(userId, id);

    if (interview.status === InterviewStatus.IN_PROGRESS) {
      throw new InterviewAlreadyStartedException();
    }
    if (interview.status === InterviewStatus.COMPLETED) {
      throw new InterviewAlreadyCompletedException();
    }

    const updated = await this.interviewRepository.updateStatus(
      id,
      InterviewStatus.IN_PROGRESS,
    );

    // Emit Kafka event
    try {
      await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_STARTED, {
        interviewId: id,
        userId,
        startedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn("Failed to emit INTERVIEW_STARTED event", error);
    }

    return updated!;
  }

  async submitAnswer(
    userId: string,
    id: string,
    dto: SubmitAnswerDto,
  ): Promise<InterviewDocument> {
    const interview = await this.findById(userId, id);

    if (interview.status !== InterviewStatus.IN_PROGRESS) {
      throw new InterviewNotStartedException();
    }

    const answer: InterviewAnswer = {
      questionId: dto.questionId,
      questionTitle: dto.questionTitle,
      answer: dto.answer,
      strengths: [],
      improvements: [],
      answeredAt: new Date(),
    } as InterviewAnswer;

    const updated = await this.interviewRepository.addAnswer(id, answer);

    // Emit Kafka event for AI evaluation
    try {
      await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_ANSWER_SUBMITTED, {
        interviewId: id,
        userId,
        questionId: dto.questionId,
        questionTitle: dto.questionTitle,
        questionContent: dto.questionTitle,
        answer: dto.answer,
      });
    } catch (error) {
      this.logger.warn(
        "Failed to emit INTERVIEW_ANSWER_SUBMITTED event",
        error,
      );
    }

    return updated!;
  }

  // Internal method for VAPI webhook — no userId check needed
  async submitAnswerInternal(
    interviewId: string,
    dto: SubmitAnswerDto,
  ): Promise<InterviewDocument> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) throw new InterviewNotFoundException(interviewId);

    const answer: InterviewAnswer = {
      questionId: dto.questionId,
      questionTitle: dto.questionTitle,
      answer: dto.answer,
      strengths: [],
      improvements: [],
      answeredAt: new Date(),
    } as InterviewAnswer;

    const updated = await this.interviewRepository.addAnswer(
      interviewId,
      answer,
    );

    // Emit Kafka event
    try {
      await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_ANSWER_SUBMITTED, {
        interviewId,
        userId: interview.userId,
        questionId: dto.questionId,
        questionTitle: dto.questionTitle,
        questionContent: dto.questionTitle,
        answer: dto.answer,
      });
    } catch (error) {
      this.logger.warn("Failed to emit answer event", error);
    }

    return updated!;
  }

  async complete(userId: string, id: string): Promise<InterviewDocument> {
    const interview = await this.findById(userId, id);

    if (interview.status === InterviewStatus.COMPLETED) {
      throw new InterviewAlreadyCompletedException();
    }

    const totalScore = this.calculateAverageScore(interview);
    const overallFeedback = this.generateOverallFeedback(
      totalScore,
      interview.answers.length,
    );

    const updated = await this.interviewRepository.setCompletion(
      id,
      totalScore,
      overallFeedback,
    );

    // Emit Kafka event
    try {
      await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_COMPLETED, {
        interviewId: id,
        userId,
        totalScore,
        completedAt: new Date().toISOString(),
        totalTimeSpent: 0,
      });
    } catch (error) {
      this.logger.warn("Failed to emit INTERVIEW_COMPLETED event", error);
    }

    return updated!;
  }

  async completeWithReport(
    interviewId: string,
    report: InterviewReport,
    overallFeedback: string,
  ): Promise<InterviewDocument> {
    const updated = await this.interviewRepository.setReport(
      interviewId,
      report,
      report.overallScore,
      overallFeedback,
    );

    if (!updated) throw new InterviewNotFoundException(interviewId);

    this.logger.log(
      `Interview ${interviewId} completed with score: ${report.overallScore}`,
    );

    // Emit Kafka event
    try {
      await this.kafkaProducer.emit(KafkaTopics.INTERVIEW_COMPLETED, {
        interviewId,
        userId: updated.userId,
        totalScore: report.overallScore,
        completedAt: new Date().toISOString(),
        totalTimeSpent: 0,
      });
    } catch (error) {
      this.logger.warn("Failed to emit INTERVIEW_COMPLETED event", error);
    }

    return updated;
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
    return updated!;
  }

  async getStats(userId: string): Promise<InterviewStatsDto> {
    return this.interviewRepository.getStats(userId);
  }

  // Update answer with AI evaluation feedback (from Kafka event)
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
      score: feedback.score,
      feedback: feedback.feedback,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      evaluatedAt: new Date(),
    });

    this.logger.log(
      `Answer evaluated for interview ${interviewId}, question ${questionId}`,
    );
  }

  private calculateAverageScore(interview: InterviewDocument): number {
    const scoredAnswers = interview.answers.filter(
      (a) => a.score !== undefined,
    );
    if (scoredAnswers.length === 0) return 0;
    const sum = scoredAnswers.reduce((acc, a) => acc + (a.score || 0), 0);
    return Math.round(sum / scoredAnswers.length);
  }

  private generateOverallFeedback(
    score: number,
    questionCount: number,
  ): string {
    if (score >= 90)
      return `Mükemmel performans! ${questionCount} sorudan ${score} puan aldınız.`;
    if (score >= 75)
      return `İyi performans! ${questionCount} sorudan ${score} puan aldınız.`;
    if (score >= 60)
      return `Orta düzey performans. ${questionCount} sorudan ${score} puan aldınız.`;
    return `Geliştirilmesi gereken alanlar var. ${questionCount} sorudan ${score} puan aldınız.`;
  }
}
