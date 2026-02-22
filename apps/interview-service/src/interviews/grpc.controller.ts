import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { InterviewsService } from "./interviews.service";

@Controller()
export class GrpcInterviewsController {
  private readonly logger = new Logger(GrpcInterviewsController.name);

  constructor(private readonly interviewsService: InterviewsService) {}

  @GrpcMethod("InterviewService", "GetInterview")
  async getInterview(data: { interview_id: string; user_id: string }) {
    this.logger.debug(`gRPC GetInterview: ${data.interview_id}`);
    const interview = await this.interviewsService.findById(
      data.user_id,
      data.interview_id,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "GetUserInterviews")
  async getUserInterviews(data: {
    user_id: string;
    page: number;
    limit: number;
    status?: string;
  }) {
    this.logger.debug(`gRPC GetUserInterviews: ${data.user_id}`);
    const result = await this.interviewsService.findByUserId(data.user_id, {
      page: data.page || 1,
      limit: data.limit || 10,
      status: data.status as any,
    });
    return {
      interviews: result.interviews.map((i) => this.toGrpcResponse(i)),
      total: result.total,
      page: result.page,
      total_pages: result.totalPages,
    };
  }

  @GrpcMethod("InterviewService", "GetInterviewStats")
  async getInterviewStats(data: { user_id: string }) {
    this.logger.debug(`gRPC GetInterviewStats: ${data.user_id}`);
    return this.interviewsService.getStats(data.user_id);
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
    this.logger.debug(`gRPC CreateInterview: ${data.user_id}`);
    const interview = await this.interviewsService.create(data.user_id, {
      field: data.field,
      techStack: data.tech_stack,
      difficulty: data.difficulty as any,
      title: data.title,
      vapiCallId: data.vapi_call_id,
      questionCount: data.question_count,
    } as any);
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "StartInterview")
  async startInterview(data: { interview_id: string; user_id: string }) {
    this.logger.debug(`gRPC StartInterview: ${data.interview_id}`);
    const interview = await this.interviewsService.start(
      data.user_id,
      data.interview_id,
    );
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
    this.logger.debug(`gRPC SubmitAnswer: ${data.interview_id}`);
    const interview = await this.interviewsService.submitAnswer(
      data.user_id,
      data.interview_id,
      {
        questionId: data.question_id,
        questionTitle: data.question_title,
        answer: data.answer,
      } as any,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CompleteInterview")
  async completeInterview(data: { interview_id: string; user_id: string }) {
    this.logger.debug(`gRPC CompleteInterview: ${data.interview_id}`);
    const interview = await this.interviewsService.complete(
      data.user_id,
      data.interview_id,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CompleteWithReport")
  async completeWithReport(data: {
    interview_id: string;
    report: any;
    overall_feedback: string;
  }) {
    this.logger.debug(`gRPC CompleteWithReport: ${data.interview_id}`);
    const interview = await this.interviewsService.completeWithReport(
      data.interview_id,
      data.report,
      data.overall_feedback,
    );
    return this.toGrpcResponse(interview);
  }

  @GrpcMethod("InterviewService", "CancelInterview")
  async cancelInterview(data: { interview_id: string; user_id: string }) {
    this.logger.debug(`gRPC CancelInterview: ${data.interview_id}`);
    const interview = await this.interviewsService.cancel(
      data.user_id,
      data.interview_id,
    );
    return this.toGrpcResponse(interview);
  }

  private toGrpcResponse(interview: any) {
    const json = interview.toJSON ? interview.toJSON() : interview;
    return {
      id: json._id?.toString() || json.id || "",
      user_id: json.userId || "",
      title: json.title || "",
      field: json.field || "",
      tech_stack: json.techStack || [],
      type: json.type || "",
      status: json.status || "",
      difficulty: json.difficulty || "",
      duration_minutes: json.durationMinutes || 0,
      total_score: json.totalScore ?? undefined,
      overall_feedback: json.overallFeedback || "",
      created_at: json.createdAt ? new Date(json.createdAt).toISOString() : "",
      answers: (json.answers || []).map((a: any) => ({
        question_id: a.questionId || "",
        question_title: a.questionTitle || "",
        answer: a.answer || "",
        feedback: a.feedback || "",
        score: a.score ?? undefined,
        strengths: a.strengths || [],
        improvements: a.improvements || [],
      })),
      report: json.report
        ? {
            technical_score: json.report.technicalScore || 0,
            communication_score: json.report.communicationScore || 0,
            diction_score: json.report.dictionScore || 0,
            confidence_score: json.report.confidenceScore || 0,
            overall_score: json.report.overallScore || 0,
            summary: json.report.summary || "",
            recommendations: json.report.recommendations || [],
            question_evaluations: (json.report.questionEvaluations || []).map(
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
    };
  }
}
