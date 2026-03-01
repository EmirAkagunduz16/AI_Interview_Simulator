import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { InterviewsService } from "./interviews.service";

@Controller()
export class GrpcInterviewsController {
  private readonly logger = new Logger(GrpcInterviewsController.name);

  constructor(private readonly interviewsService: InterviewsService) {}

  @GrpcMethod("InterviewService", "GetInterview")
  async getInterview(data: { interview_id: string; user_id: string }) {
    const interviewId = data.interview_id || (data as any).interviewId;
    const userId = data.user_id || (data as any).userId;
    this.logger.debug(
      `gRPC GetInterview: ${interviewId} (user: ${userId || "none"})`,
    );

    // userId boşsa veya "anonymous" ise (ör. VAPI webhook @Public() endpoint'ten geliyorsa)
    // doğrudan interviewId ile çek — userId eşleştirme yapma
    let interview;
    if (userId && userId !== "anonymous") {
      interview = await this.interviewsService.findById(userId, interviewId);
    } else {
      interview = await this.interviewsService.findByIdInternal(interviewId);
    }
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "GetInterviewByVapiCallId")
  async getInterviewByVapiCallId(data: { vapi_call_id: string }) {
    const vapiCallId = data.vapi_call_id || (data as any).vapiCallId;
    this.logger.debug(`gRPC GetInterviewByVapiCallId: ${vapiCallId}`);
    const interview = await this.interviewsService.findByVapiCallId(vapiCallId);
    if (!interview) {
      throw new Error(`Interview not found for VAPI Call ID: ${vapiCallId}`);
    }
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "GetUserInterviews")
  async getUserInterviews(data: {
    user_id: string;
    page: number;
    limit: number;
    status?: string;
  }) {
    const userId = data.user_id || (data as any).userId;
    this.logger.debug(`gRPC GetUserInterviews: ${userId}`);
    const result = await this.interviewsService.findByUserId(userId, {
      page: data.page || 1,
      limit: data.limit || 10,
      status: data.status as any,
    });
    return {
      interviews: result.interviews.map((i) => this.toGrpcResponse(i)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    } as any;
  }

  @GrpcMethod("InterviewService", "GetInterviewStats")
  async getInterviewStats(data: { user_id: string }) {
    const userId = data.user_id || (data as any).userId;
    this.logger.debug(`gRPC GetInterviewStats: ${userId}`);
    const stats = await this.interviewsService.getStats(userId);
    return {
      totalInterviews: stats.totalInterviews,
      completedInterviews: stats.completedInterviews,
      averageScore: stats.averageScore,
      bestScore: stats.bestScore,
      totalQuestionsAnswered: stats.totalQuestionsAnswered,
    } as any;
  }

  @GrpcMethod("InterviewService", "CreateInterview")
  async createInterview(data: {
    user_id: string;
    field: string;
    tech_stack: string[];
    difficulty: string;
    title?: string;
    vapi_call_id?: string;
    question_count?: number;
  }) {
    const userId = data.user_id || (data as any).userId;
    this.logger.debug(`gRPC CreateInterview: ${userId}`);
    const techStack = data.tech_stack || (data as any).techStack;
    const vapiCallId = data.vapi_call_id || (data as any).vapiCallId;
    const questionCount = data.question_count || (data as any).questionCount;

    const interview = await this.interviewsService.create(userId, {
      field: data.field,
      techStack,
      difficulty: data.difficulty as any,
      title: data.title,
      vapiCallId,
      questionCount,
    } as any);
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "StartInterview")
  async startInterview(data: { interview_id: string; user_id: string }) {
    const interviewId = data.interview_id || (data as any).interviewId;
    const userId = data.user_id || (data as any).userId;
    this.logger.debug(
      `gRPC StartInterview: ${interviewId} (user: ${userId || "none"})`,
    );

    // "anonymous" veya boş userId → internal start (userId check yok)
    let interview;
    if (userId && userId !== "anonymous") {
      interview = await this.interviewsService.start(userId, interviewId);
    } else {
      // Internal: sadece interviewId ile bul ve başlat
      const found = await this.interviewsService.findByIdInternal(interviewId);
      interview = await this.interviewsService.start(found.userId, interviewId);
    }
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "SubmitAnswer")
  async submitAnswer(data: {
    interview_id: string;
    user_id: string;
    question_id: string;
    question_title: string;
    answer: string;
  }) {
    const interviewId = data.interview_id || (data as any).interviewId;
    const userId = data.user_id || (data as any).userId;
    const questionId = data.question_id || (data as any).questionId;
    const questionTitle = data.question_title || (data as any).questionTitle;

    this.logger.debug(
      `gRPC SubmitAnswer: ${interviewId} (user: ${userId || "none"})`,
    );

    // "anonymous" veya boş userId → internal submit (userId check yok)
    let interview;
    if (userId && userId !== "anonymous") {
      interview = await this.interviewsService.submitAnswer(
        userId,
        interviewId,
        { questionId, questionTitle, answer: data.answer } as any,
      );
    } else {
      interview = await this.interviewsService.submitAnswerInternal(
        interviewId,
        { questionId, questionTitle, answer: data.answer } as any,
      );
    }
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CompleteInterview")
  async completeInterview(data: { interview_id: string; user_id: string }) {
    const interviewId = data.interview_id || (data as any).interviewId;
    const userId = data.user_id || (data as any).userId;
    this.logger.debug(`gRPC CompleteInterview: ${interviewId}`);
    const interview = await this.interviewsService.complete(
      userId,
      interviewId,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CompleteWithReport")
  async completeWithReport(data: {
    interview_id: string;
    report: any;
    overall_feedback: string;
  }) {
    const interviewId = data.interview_id || (data as any).interviewId;
    const overallFeedback =
      data.overall_feedback || (data as any).overallFeedback;
    this.logger.debug(`gRPC CompleteWithReport: ${interviewId}`);
    const interview = await this.interviewsService.completeWithReport(
      interviewId,
      data.report,
      overallFeedback,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CancelInterview")
  async cancelInterview(data: { interview_id: string; user_id: string }) {
    const interviewId = data.interview_id || (data as any).interviewId;
    const userId = data.user_id || (data as any).userId;
    this.logger.debug(`gRPC CancelInterview: ${interviewId}`);
    const interview = await this.interviewsService.cancel(userId, interviewId);
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "AddInterviewMessage")
  async addInterviewMessage(data: {
    interview_id: string;
    user_id: string;
    role: string;
    content: string;
  }) {
    const interviewId = data.interview_id || (data as any).interviewId;
    const userId = data.user_id || (data as any).userId;
    const role = data.role as "user" | "agent";
    const content = data.content;

    this.logger.debug(`gRPC AddInterviewMessage: ${interviewId} [${role}]`);
    const interview = await this.interviewsService.addMessage(
      interviewId,
      userId,
      role,
      content,
    );
    return this.toGrpcResponse(interview);
  }

  private toGrpcResponse(interview: any) {
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
      createdAt: json.createdAt ? new Date(json.createdAt).toISOString() : "",
      answers: (json.answers || []).map((a: any) => ({
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
              (qe: any) => ({
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
      messages: (json.messages || []).map((m: any) => ({
        role: m.role || "",
        content: m.content || "",
        created_at: m.createdAt ? new Date(m.createdAt).toISOString() : "",
      })),
    } as any;
  }
}
