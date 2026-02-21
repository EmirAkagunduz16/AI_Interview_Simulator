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
  Headers,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { GeminiService } from "./ai.service";
import {
  GenerateQuestionsDto,
  GenerateQuestionsResponseDto,
  EvaluateInterviewDto,
  InterviewReportDto,
} from "./dto";

@ApiTags("AI")
@Controller("ai")
export class AiController {
  private readonly logger = new Logger(AiController.name);
  private readonly interviewServiceUrl: string;
  private readonly questionServiceUrl: string;

  constructor(
    private readonly geminiService: GeminiService,
    private readonly configService: ConfigService,
  ) {
    this.interviewServiceUrl =
      this.configService.get<string>("INTERVIEW_SERVICE_URL") ||
      "http://localhost:3005/api/v1";
    this.questionServiceUrl =
      this.configService.get<string>("QUESTION_SERVICE_URL") ||
      "http://localhost:3004/api/v1";
  }

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

    return evaluation;
  }

  // ========== VAPI Webhook ==========

  @Post("vapi/webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "VAPI voice agent webhook handler" })
  async handleVapiWebhook(
    @Body() body: any,
    @Headers("x-user-id") userId?: string,
  ): Promise<any> {
    const { message } = body;

    if (!message) {
      return { received: true };
    }

    this.logger.log(`VAPI webhook: ${message.type}`);

    switch (message.type) {
      case "function-call":
        return this.handleFunctionCall(message, userId);

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

  private async handleFunctionCall(
    message: any,
    headerUserId?: string,
  ): Promise<any> {
    const { functionCall } = message;

    this.logger.log(`Function call: ${functionCall.name}`);

    switch (functionCall.name) {
      case "save_preferences": {
        const {
          field,
          techStack,
          difficulty,
          userId: paramsUserId,
          interviewId,
        } = functionCall.parameters;

        const userId = headerUserId || paramsUserId || "anonymous";

        try {
          // 1. Create interview via interview-service OR fetch if exists
          let interview;
          try {
            if (interviewId) {
              const res = await axios.get(
                `${this.interviewServiceUrl}/interviews/${interviewId}`,
                { headers: { "x-user-id": userId } },
              );
              interview = res.data;
            } else {
              const createReq = await axios.post(
                `${this.interviewServiceUrl}/interviews`,
                {
                  field,
                  techStack,
                  difficulty,
                  vapiCallId: message.call?.id,
                  title: `${field} Developer Interview`,
                  questionCount: 5,
                },
                {
                  headers: { "x-user-id": userId },
                },
              );
              interview = createReq.data;
            }
          } catch (e) {
            this.logger.error("Failed to access interview", e);
            throw new Error("Could not initialize interview");
          }
          // 2. Fetch or Generate questions
          const questionCount = 5;
          let questions: any[] = [];

          try {
            // Try fetching from question-service
            const query = new URLSearchParams();
            if (field) query.append("category", field);
            if (difficulty) query.append("difficulty", difficulty);
            query.append("count", questionCount.toString());

            const res = await axios.get(
              `${this.questionServiceUrl}/questions/random?${query}`,
            );
            questions = res.data || [];
          } catch (e) {
            this.logger.warn("Failed to fetch from question-service", e);
          }

          // If not enough questions in DB, try generating via question-service
          if (questions.length < questionCount) {
            this.logger.log(
              `Not enough questions in DB (${questions.length}/${questionCount}). Generating more...`,
            );
            try {
              await axios.post(
                `${this.questionServiceUrl}/questions/generate`,
                {
                  field: field || "fullstack",
                  techStack: techStack || [],
                  difficulty: difficulty || "intermediate",
                  count: questionCount,
                },
              );

              // Re-fetch after generating to ensure we get a completely random mix
              const query = new URLSearchParams();
              if (field) query.append("category", field);
              if (difficulty) query.append("difficulty", difficulty);
              query.append("count", questionCount.toString());

              const res2 = await axios.get(
                `${this.questionServiceUrl}/questions/random?${query}`,
              );
              questions = res2.data || [];
            } catch (e) {
              this.logger.error(
                "Failed to generate questions. Falling back to Gemini service directly",
                e,
              );
              // Last resort fallback directly via ai-service gemini integration
              const fallbackQuestions =
                await this.geminiService.generateInterviewQuestions({
                  field: field || "fullstack",
                  techStack: techStack || [],
                  difficulty: difficulty || "intermediate",
                  count: questionCount,
                });
              questions = fallbackQuestions.map((q) => ({
                content: q.question,
                order: q.order,
              }));
            }
          }

          // Map questions to the expected output format
          const formattedQuestions = questions
            .slice(0, questionCount)
            .map((q: any, index: number) => ({
              question: q.content || q.title || q.question, // Extract the question text
              order: index + 1,
            }));

          // 3. Start the interview
          await axios.post(
            `${this.interviewServiceUrl}/interviews/${interview.id}/start`,
            null,
            { headers: { "x-user-id": userId || "anonymous" } },
          );

          return {
            result: {
              interviewId: interview.id,
              firstQuestion: formattedQuestions[0]?.question,
              totalQuestions: formattedQuestions.length,
              questions: formattedQuestions.map((q) => ({
                id: `q_${q.order}`,
                question: q.question,
                order: q.order,
              })),
              message: `${formattedQuestions.length} soru hazırlandı. İlk soru ile başlıyoruz.`,
            },
          };
        } catch (error) {
          this.logger.error("Failed to save preferences", error);
          return {
            result: {
              error: "Mülakat oluşturulamadı, lütfen tekrar deneyin.",
            },
          };
        }
      }

      case "get_next_question": {
        const { interviewId, currentOrder, questions } =
          functionCall.parameters;

        // If questions were passed from the initial save_preferences, use them
        if (questions && Array.isArray(questions)) {
          const nextQ = questions.find(
            (q: any) => q.order === (currentOrder || 0) + 1,
          );

          if (nextQ) {
            return {
              result: {
                question: nextQ.question,
                order: nextQ.order,
                totalQuestions: questions.length,
                remaining: questions.length - nextQ.order,
              },
            };
          }
        }

        return {
          result: {
            finished: true,
            message: "Tüm sorular tamamlandı. Mülakat sona erdi.",
          },
        };
      }

      case "save_answer": {
        const { interviewId, questionOrder, questionText, answer } =
          functionCall.parameters;

        try {
          // Save answer via interview-service
          await axios.post(
            `${this.interviewServiceUrl}/interviews/${interviewId}/submit`,
            {
              questionId: `q_${questionOrder}`,
              questionTitle: questionText || `Soru ${questionOrder}`,
              answer: answer,
            },
            {
              headers: { "x-user-id": headerUserId || "anonymous" },
            },
          );
        } catch (error) {
          this.logger.warn(
            "Failed to save answer via interview-service",
            error,
          );
        }

        return { result: { saved: true } };
      }

      case "end_interview": {
        const { interviewId, answers } = functionCall.parameters;

        try {
          // Get interview data
          let interviewData: any;
          try {
            const res = await axios.get(
              `${this.interviewServiceUrl}/interviews/${interviewId}`,
              { headers: { "x-user-id": headerUserId || "anonymous" } },
            );
            interviewData = res.data;
          } catch {
            interviewData = { field: "fullstack", techStack: [] };
          }

          // Build answers array from function call params or interview data
          const answersForEval =
            answers ||
            interviewData?.answers?.map((a: any) => ({
              question: a.questionTitle,
              answer: a.answer,
              order: 1,
            })) ||
            [];

          if (answersForEval.length > 0) {
            // Evaluate with Gemini
            const evaluation = await this.geminiService.evaluateInterview({
              field: interviewData.field || "fullstack",
              techStack: interviewData.techStack || [],
              answers: answersForEval,
            });

            // Complete interview with report via interview-service
            try {
              await axios.post(
                `${this.interviewServiceUrl}/interviews/${interviewId}/complete-with-report`,
                {
                  report: {
                    technicalScore: evaluation.technicalScore,
                    communicationScore: evaluation.communicationScore,
                    dictionScore: evaluation.dictionScore,
                    confidenceScore: evaluation.confidenceScore,
                    overallScore: evaluation.overallScore,
                    summary: evaluation.summary,
                    recommendations: evaluation.recommendations,
                  },
                  overallFeedback: evaluation.summary,
                },
                { headers: { "x-user-id": headerUserId || "anonymous" } },
              );
            } catch (e) {
              this.logger.warn("Failed to complete interview", e);
            }

            return {
              result: {
                completed: true,
                overallScore: evaluation.overallScore,
                summary: evaluation.summary,
              },
            };
          }

          // Complete with empty report if no answers were given
          try {
            await axios.post(
              `${this.interviewServiceUrl}/interviews/${interviewId}/complete-with-report`,
              {
                report: {
                  technicalScore: 0,
                  communicationScore: 0,
                  dictionScore: 0,
                  confidenceScore: 0,
                  overallScore: 0,
                  summary:
                    "Mülakat erken sonlandırıldı veya hiç cevap verilmedi.",
                  recommendations: ["Mülakat pratiği yapmaya devam edin."],
                },
                overallFeedback:
                  "Mülakat erken sonlandırıldığı için değerlendirme yapılamadı.",
              },
              { headers: { "x-user-id": headerUserId || "anonymous" } },
            );
          } catch (e) {
            this.logger.warn("Failed to complete empty interview", e);
          }

          return {
            result: { completed: true, message: "Mülakat tamamlandı." },
          };
        } catch (error) {
          this.logger.error("Failed to end interview", error);
          return {
            result: { completed: true, message: "Mülakat tamamlandı." },
          };
        }
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
  }
}
