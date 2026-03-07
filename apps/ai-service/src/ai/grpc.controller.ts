import { Controller, Logger, Inject, OnModuleInit } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import {
  GRPC_INTERVIEW_SERVICE,
  GRPC_QUESTION_SERVICE,
  IGrpcInterviewService,
  IGrpcQuestionService,
  AiGenerateQuestionsRequest,
  HandleVapiWebhookRequest,
  HandleVapiWebhookResponse,
  InterviewResponse,
} from "@ai-coach/grpc";
import { GeminiService } from "./ai.service";

interface FunctionCallParams {
  field?: string;
  techStack?: string[];
  difficulty?: string;
  userId?: string;
  interviewId?: string;
  questionOrder?: number;
  questionText?: string;
  answer?: string;
  answers?: { question?: string; questionText?: string; answer?: string; order?: number }[];
  questions?: { question: string; order: number; id?: string }[];
  currentOrder?: number;
}

@Controller()
export class GrpcAiController implements OnModuleInit {
  private readonly logger = new Logger(GrpcAiController.name);
  private interviewService!: IGrpcInterviewService;
  private questionService!: IGrpcQuestionService;

  constructor(
    private readonly geminiService: GeminiService,
    @Inject(GRPC_INTERVIEW_SERVICE) private readonly interviewGrpc: ClientGrpc,
    @Inject(GRPC_QUESTION_SERVICE) private readonly questionGrpc: ClientGrpc,
  ) {}

  onModuleInit() {
    this.interviewService =
      this.interviewGrpc.getService<IGrpcInterviewService>("InterviewService");
    this.questionService =
      this.questionGrpc.getService<IGrpcQuestionService>("QuestionService");
    this.logger.log("gRPC clients initialized (Interview + Question)");
  }

  @GrpcMethod("AiService", "GenerateQuestions")
  async generateQuestions(data: AiGenerateQuestionsRequest) {
    this.logger.debug(`gRPC GenerateQuestions: ${data.field}`);
    const questions = await this.geminiService.generateInterviewQuestions({
      field: data.field,
      techStack: data.techStack,
      difficulty: data.difficulty,
      count: data.count,
    });
    return { questions };
  }

  @GrpcMethod("AiService", "HandleVapiWebhook")
  async handleVapiWebhook(
    data: HandleVapiWebhookRequest,
  ): Promise<HandleVapiWebhookResponse> {
    this.logger.debug("gRPC HandleVapiWebhook called");

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(data.jsonBody || "{}");
    } catch {
      return { jsonResponse: JSON.stringify({ received: true }) };
    }

    const userId = data.userId;
    const message = body.message as Record<string, unknown> | undefined;

    if (!message) {
      return { jsonResponse: JSON.stringify({ received: true }) };
    }

    this.logger.log(`VAPI webhook: ${message.type}`);

    let result: Record<string, unknown>;

    switch (message.type) {
      case "function-call":
        result = await this.handleFunctionCall(message, userId);
        break;

      case "end-of-call-report":
        await this.handleEndOfCall(message);
        result = { received: true };
        break;

      case "status-update":
        this.logger.log(`Call status: ${message.status}`);
        result = { received: true };
        break;

      case "transcript":
        this.logger.debug(
          `Transcript [${message.role}]: ${message.transcript}`,
        );
        if (message.transcript && (message.call as Record<string, unknown>)?.id) {
          try {
            const callId = (message.call as Record<string, unknown>).id as string;
            const interview = await firstValueFrom(
              this.interviewService.getInterviewByVapiCallId({
                vapiCallId: callId,
              }),
            );

            if (interview?.id) {
              await firstValueFrom(
                this.interviewService.addInterviewMessage({
                  interviewId: interview.id,
                  userId: interview.userId || "anonymous",
                  role: message.role === "assistant" ? "agent" : "user",
                  content: message.transcript as string,
                }),
              );
            }
          } catch (e) {
            this.logger.warn("Failed to dispatch transcript", e);
          }
        }
        result = { received: true };
        break;

      default:
        result = { received: true };
    }

    return { jsonResponse: JSON.stringify(result) };
  }

  private async handleFunctionCall(
    message: Record<string, unknown>,
    headerUserId?: string,
  ): Promise<Record<string, unknown>> {
    const functionCall = message.functionCall as {
      name: string;
      parameters: FunctionCallParams;
    };

    this.logger.log(`Function call: ${functionCall.name}`);

    switch (functionCall.name) {
      case "save_preferences":
        return this.handleSavePreferences(functionCall, message, headerUserId);

      case "save_answer":
        return this.handleSaveAnswer(functionCall, headerUserId);

      case "get_next_question":
        return this.handleGetNextQuestion(functionCall);

      case "end_interview":
        return this.handleEndInterview(functionCall, headerUserId);

      default:
        this.logger.warn(`Unknown function call: ${functionCall.name}`);
        return { result: { error: "Unknown function" } };
    }
  }

  private async handleSavePreferences(
    functionCall: { name: string; parameters: FunctionCallParams },
    message: Record<string, unknown>,
    headerUserId?: string,
  ): Promise<Record<string, unknown>> {
    const { field, techStack, difficulty, userId: paramsUserId, interviewId } =
      functionCall.parameters;

    const userId = headerUserId || paramsUserId || "anonymous";
    const questionCount = 5;

    try {
      let interview: InterviewResponse;
      if (interviewId) {
        interview = await firstValueFrom(
          this.interviewService.getInterview({ interviewId, userId }),
        );
      } else {
        const callInfo = message.call as Record<string, unknown> | undefined;
        interview = await firstValueFrom(
          this.interviewService.createInterview({
            userId,
            field: field || "fullstack",
            techStack: techStack || [],
            difficulty: difficulty || "intermediate",
            title: `${field} Developer Interview`,
            questionCount,
            vapiCallId: callInfo?.id as string | undefined,
          }),
        );
      }

      let questions: { content?: string; title?: string; question?: string; order?: number }[] =
        [];
      try {
        const result = await firstValueFrom(
          this.questionService.getRandomQuestions({
            count: questionCount,
            category: field,
            difficulty,
            tags: (techStack || []).join(","),
          }),
        );
        questions = result.questions || [];
      } catch (e) {
        this.logger.warn(
          "question-service'ten soru çekilemedi, generate ediliyor...",
          e,
        );
      }

      if (questions.length < questionCount) {
        try {
          const genResult = await firstValueFrom(
            this.questionService.generateQuestions({
              field: field || "fullstack",
              techStack: techStack || [],
              difficulty: difficulty || "intermediate",
              count: questionCount,
            }),
          );

          const retryResult = await firstValueFrom(
            this.questionService.getRandomQuestions({
              count: questionCount,
              category: field,
              difficulty,
              tags: (techStack || []).join(","),
            }),
          );
          questions = retryResult.questions || genResult.questions || [];
        } catch (e) {
          this.logger.error(
            "question-service soru üretemedi, Gemini fallback",
            e,
          );
          const fallback = await this.geminiService.generateInterviewQuestions({
            field: field || "fullstack",
            techStack: techStack || [],
            difficulty: difficulty || "intermediate",
            count: questionCount,
          });
          questions = fallback.map((q) => ({
            content: q.question,
            order: q.order,
          }));
        }
      }

      const formattedQuestions = questions
        .slice(0, questionCount)
        .map((q, index: number) => ({
          question: q.content || q.title || q.question || "",
          order: index + 1,
        }));

      await firstValueFrom(
        this.interviewService.startInterview({
          interviewId: interview.id,
          userId,
        }),
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
      this.logger.error(
        `save_preferences başarısız: ${(error as Error)?.message || error}`,
        (error as Error)?.stack || "",
      );
      return {
        result: {
          error: "Mülakat oluşturulamadı, lütfen tekrar deneyin.",
        },
      };
    }
  }

  private async handleSaveAnswer(
    functionCall: { name: string; parameters: FunctionCallParams },
    headerUserId?: string,
  ): Promise<Record<string, unknown>> {
    const { interviewId, questionOrder, questionText, answer, questions } =
      functionCall.parameters;

    try {
      await firstValueFrom(
        this.interviewService.submitAnswer({
          interviewId: interviewId || "",
          userId: headerUserId || "anonymous",
          questionId: `q_${questionOrder}`,
          questionTitle: questionText || `Soru ${questionOrder}`,
          answer: answer || "",
        }),
      );
    } catch (error) {
      this.logger.warn("Cevap kaydedilemedi (interview-service)", error);
    }

    if (questions && Array.isArray(questions)) {
      const currentOrder = questionOrder || 0;
      const nextQ = questions.find((q) => q.order === currentOrder + 1);

      if (nextQ) {
        return {
          result: {
            saved: true,
            nextQuestion: nextQ.question,
            progress: `Soru ${nextQ.order} / ${questions.length}`,
            feedback: `Cevap kaydedildi. Şimdi ${nextQ.order}. soruya geçebilirsin. Cevabı değerlendirdikten sonra doğal bir geçişle bu soruyu sor.`,
          },
        };
      }

      return {
        result: {
          saved: true,
          finished: true,
          message:
            "Tüm sorular tamamlandı. Mülakatı bitirmek için end_interview çağır.",
        },
      };
    }

    return { result: { saved: true } };
  }

  private async handleGetNextQuestion(
    functionCall: { name: string; parameters: FunctionCallParams },
  ): Promise<Record<string, unknown>> {
    const { currentOrder, questions } = functionCall.parameters;

    if (questions && Array.isArray(questions)) {
      const nextQ = questions.find(
        (q) => q.order === (currentOrder || 0) + 1,
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

  private async handleEndInterview(
    functionCall: { name: string; parameters: FunctionCallParams },
    headerUserId?: string,
  ): Promise<Record<string, unknown>> {
    const { interviewId, answers } = functionCall.parameters;

    this.logger.log(
      `end_interview called — interviewId: ${interviewId}, headerUserId: ${headerUserId || "(empty)"}, ` +
        `answers from params: ${answers?.length ?? 0}`,
    );

    try {
      let interviewData: InterviewResponse | null = null;
      try {
        interviewData = await firstValueFrom(
          this.interviewService.getInterview({
            interviewId: interviewId || "",
            userId: "",
          }),
        );
        this.logger.log(
          `Interview loaded — answers in DB: ${interviewData?.answers?.length ?? 0}, ` +
            `field: ${interviewData?.field}, status: ${interviewData?.status}`,
        );
      } catch (e) {
        this.logger.warn(
          `getInterview başarısız (interviewId: ${interviewId}): ${(e as Error)?.message || e}`,
        );
      }

      let answersForEval: {
        question: string;
        answer: string;
        order: number;
      }[] = [];

      if (interviewData?.answers?.length) {
        answersForEval = interviewData.answers.map((a, idx: number) => ({
          question: a.questionTitle || `Soru ${idx + 1}`,
          answer: a.answer || "",
          order: idx + 1,
        }));
        this.logger.log(`${answersForEval.length} cevap DB'den alındı`);
      } else if (answers?.length) {
        answersForEval = answers.map((a, idx: number) => ({
          question: a.question || a.questionText || `Soru ${idx + 1}`,
          answer: a.answer || "",
          order: a.order || idx + 1,
        }));
        this.logger.log(
          `${answersForEval.length} cevap parametrelerden alındı`,
        );
      }

      const interviewField = interviewData?.field || "fullstack";
      const interviewTechStack = interviewData?.techStack || [];

      if (answersForEval.length > 0) {
        this.logger.log(
          `Gemini değerlendirmesi başlatılıyor — ${answersForEval.length} cevap, alan: ${interviewField}`,
        );

        const evaluation = await this.geminiService.evaluateInterview({
          field: interviewField,
          techStack: interviewTechStack,
          answers: answersForEval,
        });

        this.logger.log(
          `Gemini değerlendirmesi tamamlandı — overallScore: ${evaluation.overallScore}`,
        );

        try {
          await firstValueFrom(
            this.interviewService.completeWithReport({
              interviewId: interviewId || "",
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
            }),
          );
          this.logger.log(`Interview ${interviewId} report kaydedildi`);
        } catch (e) {
          this.logger.warn("Interview complete-with-report başarısız", e);
        }

        return {
          result: {
            completed: true,
            overallScore: evaluation.overallScore,
            summary: evaluation.summary,
          },
        };
      }

      this.logger.warn(
        `Interview ${interviewId} — hiç cevap bulunamadı, boş rapor gönderiliyor`,
      );

      try {
        await firstValueFrom(
          this.interviewService.completeWithReport({
            interviewId: interviewId || "",
            report: {
              technicalScore: 0,
              communicationScore: 0,
              dictionScore: 0,
              confidenceScore: 0,
              overallScore: 0,
              summary: "Mülakat erken sonlandırıldı veya hiç cevap verilmedi.",
              recommendations: ["Mülakat pratiği yapmaya devam edin."],
            },
            overallFeedback:
              "Mülakat erken sonlandırıldığı için değerlendirme yapılamadı.",
          }),
        );
      } catch (e) {
        this.logger.warn("Boş interview tamamlanamadı", e);
      }

      return {
        result: { completed: true, message: "Mülakat tamamlandı." },
      };
    } catch (error) {
      this.logger.error("end_interview başarısız", error);
      return {
        result: { completed: true, message: "Mülakat tamamlandı." },
      };
    }
  }

  private async handleEndOfCall(
    message: Record<string, unknown>,
  ): Promise<void> {
    const call = message.call as Record<string, unknown> | undefined;
    const callId = call?.id as string | undefined;
    if (!callId) return;
    this.logger.log(`End of call: ${callId}`);
  }
}
