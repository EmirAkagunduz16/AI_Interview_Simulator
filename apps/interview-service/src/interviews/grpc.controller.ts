import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { InterviewsService } from "./interviews.service";
import { InterviewStatus } from "./entities/interview.entity";
import type {
  GetInterviewRequest,
  GetInterviewByVapiCallIdRequest,
  GetUserInterviewsRequest,
  GetInterviewStatsRequest,
  CreateInterviewRequest,
  StartInterviewRequest,
  SubmitAnswerRequest,
  CompleteInterviewRequest,
  CompleteWithReportRequest,
  CancelInterviewRequest,
  AddInterviewMessageRequest,
  InterviewResponse,
  InterviewsListResponse,
  InterviewStatsResponse,
} from "@ai-coach/grpc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MongoDocument = { toJSON?: () => Record<string, any> } & Record<string, any>;

@Controller()
export class GrpcInterviewsController {
  private readonly logger = new Logger(GrpcInterviewsController.name);

  constructor(private readonly interviewsService: InterviewsService) {}

  @GrpcMethod("InterviewService", "GetInterview")
  async getInterview(data: GetInterviewRequest): Promise<InterviewResponse> {
    this.logger.debug(
      `gRPC GetInterview: ${data.interviewId} (user: ${data.userId || "none"})`,
    );

    let interview;
    if (data.userId && data.userId !== "anonymous") {
      interview = await this.interviewsService.findById(
        data.userId,
        data.interviewId,
      );
    } else {
      interview = await this.interviewsService.findByIdInternal(
        data.interviewId,
      );
    }
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "GetInterviewByVapiCallId")
  async getInterviewByVapiCallId(
    data: GetInterviewByVapiCallIdRequest,
  ): Promise<InterviewResponse> {
    this.logger.debug(`gRPC GetInterviewByVapiCallId: ${data.vapiCallId}`);
    const interview = await this.interviewsService.findByVapiCallId(
      data.vapiCallId,
    );
    if (!interview) {
      throw new Error(
        `Interview not found for VAPI Call ID: ${data.vapiCallId}`,
      );
    }
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "GetUserInterviews")
  async getUserInterviews(
    data: GetUserInterviewsRequest,
  ): Promise<InterviewsListResponse> {
    this.logger.debug(`gRPC GetUserInterviews: ${data.userId}`);
    const result = await this.interviewsService.findByUserId(data.userId, {
      page: data.page || 1,
      limit: data.limit || 10,
      status: data.status as InterviewStatus | undefined,
    });
    return {
      interviews: result.interviews.map((i) => this.toGrpcResponse(i)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @GrpcMethod("InterviewService", "GetInterviewStats")
  async getInterviewStats(
    data: GetInterviewStatsRequest,
  ): Promise<InterviewStatsResponse> {
    this.logger.debug(`gRPC GetInterviewStats: ${data.userId}`);
    const stats = await this.interviewsService.getStats(data.userId);
    return {
      totalInterviews: stats.totalInterviews,
      completedInterviews: stats.completedInterviews,
      averageScore: stats.averageScore,
      bestScore: stats.bestScore,
      totalQuestionsAnswered: stats.totalQuestionsAnswered,
    };
  }

  @GrpcMethod("InterviewService", "CreateInterview")
  async createInterview(
    data: CreateInterviewRequest,
  ): Promise<InterviewResponse> {
    this.logger.debug(`gRPC CreateInterview: ${data.userId}`);
    const interview = await this.interviewsService.create(data.userId, {
      field: data.field,
      techStack: data.techStack,
      difficulty: data.difficulty as "junior" | "intermediate" | "senior",
      title: data.title,
      vapiCallId: data.vapiCallId,
      questionCount: data.questionCount,
    });
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "StartInterview")
  async startInterview(
    data: StartInterviewRequest,
  ): Promise<InterviewResponse> {
    this.logger.debug(
      `gRPC StartInterview: ${data.interviewId} (user: ${data.userId || "none"})`,
    );

    let interview;
    if (data.userId && data.userId !== "anonymous") {
      interview = await this.interviewsService.start(
        data.userId,
        data.interviewId,
      );
    } else {
      const found = await this.interviewsService.findByIdInternal(
        data.interviewId,
      );
      interview = await this.interviewsService.start(
        found.userId,
        data.interviewId,
      );
    }
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "SubmitAnswer")
  async submitAnswer(data: SubmitAnswerRequest): Promise<InterviewResponse> {
    this.logger.debug(
      `gRPC SubmitAnswer: ${data.interviewId} (user: ${data.userId || "none"})`,
    );

    let interview;
    if (data.userId && data.userId !== "anonymous") {
      interview = await this.interviewsService.submitAnswer(
        data.userId,
        data.interviewId,
        {
          questionId: data.questionId,
          questionTitle: data.questionTitle,
          answer: data.answer,
        },
      );
    } else {
      interview = await this.interviewsService.submitAnswerInternal(
        data.interviewId,
        {
          questionId: data.questionId,
          questionTitle: data.questionTitle,
          answer: data.answer,
        },
      );
    }
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CompleteInterview")
  async completeInterview(
    data: CompleteInterviewRequest,
  ): Promise<InterviewResponse> {
    this.logger.debug(`gRPC CompleteInterview: ${data.interviewId}`);
    const interview = await this.interviewsService.complete(
      data.userId,
      data.interviewId,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CompleteWithReport")
  async completeWithReport(
    data: CompleteWithReportRequest,
  ): Promise<InterviewResponse> {
    this.logger.debug(`gRPC CompleteWithReport: ${data.interviewId}`);
    const interview = await this.interviewsService.completeWithReport(
      data.interviewId,
      data.report,
      data.overallFeedback,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CancelInterview")
  async cancelInterview(
    data: CancelInterviewRequest,
  ): Promise<InterviewResponse> {
    this.logger.debug(`gRPC CancelInterview: ${data.interviewId}`);
    const interview = await this.interviewsService.cancel(
      data.userId,
      data.interviewId,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "AddInterviewMessage")
  async addInterviewMessage(
    data: AddInterviewMessageRequest,
  ): Promise<InterviewResponse> {
    this.logger.debug(
      `gRPC AddInterviewMessage: ${data.interviewId} [${data.role}]`,
    );
    const interview = await this.interviewsService.addMessage(
      data.interviewId,
      data.userId,
      data.role as "user" | "agent",
      data.content,
    );
    return this.toGrpcResponse(interview);
  }

  private toGrpcResponse(interview: MongoDocument): InterviewResponse {
    const json = interview.toJSON ? interview.toJSON() : interview;

    return {
      id: json._id?.toString() || json.id || "",
      userId: json.userId || "",
      title: json.title || "",
      field: json.field || "",
      techStack: json.techStack || [],
      type: json.type || "",
      status: json.status || "",
      difficulty: json.difficulty || "",
      durationMinutes: json.durationMinutes || 0,
      totalScore: json.totalScore ?? undefined,
      overallFeedback: json.overallFeedback || "",
      createdAt: json.createdAt
        ? new Date(json.createdAt).toISOString()
        : "",
      answers: (json.answers || []).map((a: MongoDocument) => ({
        questionId: a.questionId || "",
        questionTitle: a.questionTitle || "",
        answer: a.answer || "",
        feedback: a.feedback || "",
        score: a.score ?? undefined,
        strengths: a.strengths || [],
        improvements: a.improvements || [],
      })),
      report: json.report
        ? {
            technicalScore: json.report.technicalScore || 0,
            communicationScore: json.report.communicationScore || 0,
            dictionScore: json.report.dictionScore || 0,
            confidenceScore: json.report.confidenceScore || 0,
            overallScore: json.report.overallScore || 0,
            summary: json.report.summary || "",
            recommendations: json.report.recommendations || [],
            questionEvaluations: (json.report.questionEvaluations || []).map(
              (qe: MongoDocument) => ({
                question: qe.question || "",
                answer: qe.answer || "",
                score: qe.score || 0,
                feedback: qe.feedback || "",
                strengths: qe.strengths || [],
                improvements: qe.improvements || [],
              }),
            ),
          }
        : undefined,
      messages: (json.messages || []).map((m: MongoDocument) => ({
        role: m.role || "",
        content: m.content || "",
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : "",
      })),
    };
  }
}
