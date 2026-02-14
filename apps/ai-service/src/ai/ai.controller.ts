import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { GeminiService } from "./ai.service";
import { SupabaseService } from "./supabase.service";
import {
  GenerateQuestionsDto,
  GenerateQuestionsResponseDto,
  EvaluateInterviewDto,
  InterviewReportDto,
  VapiWebhookDto,
} from "./dto";

@ApiTags("AI")
@Controller("ai")
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post("generate-questions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate interview questions using Gemini" })
  @ApiResponse({ status: 200, type: GenerateQuestionsResponseDto })
  async generateQuestions(
    @Body() dto: GenerateQuestionsDto,
  ): Promise<GenerateQuestionsResponseDto> {
    const questions = await this.geminiService.generateInterviewQuestions({
      field: dto.field,
      techStack: dto.techStack,
      difficulty: dto.difficulty,
      count: dto.count,
    });

    // If interviewId provided, save to Supabase
    if (dto.interviewId) {
      await this.supabaseService.saveQuestions(
        dto.interviewId,
        questions.map((q) => ({
          question_text: q.question,
          order: q.order,
        })),
      );
    }

    return { questions };
  }

  @Post("evaluate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Evaluate interview answers using Gemini" })
  @ApiResponse({ status: 200, type: InterviewReportDto })
  async evaluateInterview(
    @Body() dto: EvaluateInterviewDto,
  ): Promise<InterviewReportDto> {
    const evaluation = await this.geminiService.evaluateInterview({
      field: dto.field,
      techStack: dto.techStack,
      answers: dto.answers,
    });

    // Save report to Supabase
    await this.supabaseService.saveReport(dto.interviewId, {
      technical_score: evaluation.technicalScore,
      communication_score: evaluation.communicationScore,
      diction_score: evaluation.dictionScore,
      confidence_score: evaluation.confidenceScore,
      overall_score: evaluation.overallScore,
      summary: evaluation.summary,
      recommendations: evaluation.recommendations,
    });

    // Update per-question evaluations
    const questions = await this.supabaseService.getQuestions(dto.interviewId);
    for (const qEval of evaluation.questionEvaluations) {
      const matchedQ = questions.find(
        (q: any) => q.question_text === qEval.question,
      );
      if (matchedQ) {
        await this.supabaseService.updateQuestionEvaluation(matchedQ.id, {
          score: qEval.score,
          feedback: qEval.feedback,
          strengths: qEval.strengths,
          improvements: qEval.improvements,
        });
      }
    }

    // Mark interview as completed
    await this.supabaseService.updateInterview(dto.interviewId, {
      status: "completed",
      total_score: evaluation.overallScore,
      overall_feedback: evaluation.summary,
      completed_at: new Date().toISOString(),
    });

    return evaluation;
  }

  // ========== VAPI Webhook ==========

  @Post("vapi/webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "VAPI voice agent webhook handler" })
  async handleVapiWebhook(@Body() body: any): Promise<any> {
    const { message } = body;

    if (!message) {
      return { received: true };
    }

    this.logger.log(`VAPI webhook: ${message.type}`);

    switch (message.type) {
      case "function-call":
        return this.handleFunctionCall(message);

      case "end-of-call-report":
        await this.handleEndOfCall(message);
        return { received: true };

      case "status-update":
        this.logger.log(`Call status: ${message.status}`);
        return { received: true };

      case "transcript":
        this.logger.debug(
          `Transcript [${message.role}]: ${message.transcript}`,
        );
        return { received: true };

      default:
        return { received: true };
    }
  }

  private async handleFunctionCall(message: any): Promise<any> {
    const { functionCall } = message;

    this.logger.log(`Function call: ${functionCall.name}`);

    switch (functionCall.name) {
      case "save_preferences": {
        const { field, techStack, difficulty, userId } =
          functionCall.parameters;

        // Create interview in Supabase
        const interview = await this.supabaseService.createInterview({
          user_id: userId || "anonymous",
          field: field || "fullstack",
          tech_stack: techStack || [],
          difficulty: difficulty || "intermediate",
          vapi_call_id: message.call?.id,
        });

        // Generate questions with Gemini
        const questions = await this.geminiService.generateInterviewQuestions({
          field,
          techStack,
          difficulty,
        });

        // Save questions to Supabase
        await this.supabaseService.saveQuestions(
          interview.id,
          questions.map((q) => ({
            question_text: q.question,
            order: q.order,
          })),
        );

        // Update interview status
        await this.supabaseService.updateInterview(interview.id, {
          status: "in_progress",
        });

        return {
          result: {
            interviewId: interview.id,
            firstQuestion: questions[0]?.question,
            totalQuestions: questions.length,
            message: `${questions.length} soru hazırlandı. İlk soru ile başlıyoruz.`,
          },
        };
      }

      case "get_next_question": {
        const { interviewId, currentOrder } = functionCall.parameters;
        const questions = await this.supabaseService.getQuestions(interviewId);
        const nextQ = questions.find(
          (q: any) => q.order_num === (currentOrder || 0) + 1,
        );

        if (nextQ) {
          return {
            result: {
              question: nextQ.question_text,
              order: nextQ.order_num,
              totalQuestions: questions.length,
              remaining: questions.length - nextQ.order_num,
            },
          };
        }

        return {
          result: {
            finished: true,
            message: "Tüm sorular tamamlandı. Mülakat sona erdi.",
          },
        };
      }

      case "save_answer": {
        const { interviewId, questionOrder, answer } = functionCall.parameters;
        const questions = await this.supabaseService.getQuestions(interviewId);
        const question = questions.find(
          (q: any) => q.order_num === questionOrder,
        );

        if (question) {
          await this.supabaseService.saveAnswer(question.id, answer);
        }

        return { result: { saved: true } };
      }

      case "end_interview": {
        const { interviewId } = functionCall.parameters;

        // Get all questions with answers
        const questions = await this.supabaseService.getQuestions(interviewId);
        const interview = await this.supabaseService.getInterview(interviewId);

        const answers = questions
          .filter((q: any) => q.answer_transcript)
          .map((q: any) => ({
            question: q.question_text,
            answer: q.answer_transcript,
            order: q.order_num,
          }));

        // Evaluate with Gemini
        if (answers.length > 0) {
          const evaluation = await this.geminiService.evaluateInterview({
            field: interview.field,
            techStack: interview.tech_stack,
            answers,
          });

          // Save report
          await this.supabaseService.saveReport(interviewId, {
            technical_score: evaluation.technicalScore,
            communication_score: evaluation.communicationScore,
            diction_score: evaluation.dictionScore,
            confidence_score: evaluation.confidenceScore,
            overall_score: evaluation.overallScore,
            summary: evaluation.summary,
            recommendations: evaluation.recommendations,
          });

          // Update question evaluations
          for (const qEval of evaluation.questionEvaluations) {
            const matchedQ = questions.find(
              (q: any) => q.question_text === qEval.question,
            );
            if (matchedQ) {
              await this.supabaseService.updateQuestionEvaluation(matchedQ.id, {
                score: qEval.score,
                feedback: qEval.feedback,
                strengths: qEval.strengths,
                improvements: qEval.improvements,
              });
            }
          }

          await this.supabaseService.updateInterview(interviewId, {
            status: "completed",
            total_score: evaluation.overallScore,
            overall_feedback: evaluation.summary,
            completed_at: new Date().toISOString(),
          });

          return {
            result: {
              completed: true,
              overallScore: evaluation.overallScore,
              summary: evaluation.summary,
            },
          };
        }

        return { result: { completed: true, message: "Mülakat tamamlandı." } };
      }

      default:
        this.logger.warn(`Unknown function call: ${functionCall.name}`);
        return { result: { error: "Unknown function" } };
    }
  }

  private async handleEndOfCall(message: any): Promise<void> {
    const callId = message.call?.id;
    if (!callId) return;

    this.logger.log(`End of call: ${callId}`);
    // The end_interview function call should have already handled evaluation
  }

  // ========== Supabase Data Endpoints ==========

  @Get("interviews")
  @ApiOperation({ summary: "Get user interviews" })
  async getUserInterviews(@Query("userId") userId: string) {
    return this.supabaseService.getUserInterviews(userId);
  }

  @Get("interviews/:id")
  @ApiOperation({ summary: "Get interview details" })
  async getInterview(@Param("id") id: string) {
    return this.supabaseService.getInterview(id);
  }
}
