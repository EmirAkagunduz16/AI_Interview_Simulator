import { Controller, Logger, Inject, OnModuleInit } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import {
  GRPC_INTERVIEW_SERVICE,
  GRPC_QUESTION_SERVICE,
  IGrpcInterviewService,
  IGrpcQuestionService,
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
  questionId?: string;
  questionText?: string;
  answer?: string;
  answers?: {
    question?: string;
    questionText?: string;
    answer?: string;
    order?: number;
  }[];
  questions?: { question: string; order: number; id?: string }[];
  currentOrder?: number;
}

interface CachedQuestion {
  id: string;
  question: string;
  order: number;
}

@Controller()
export class GrpcAiController implements OnModuleInit {
  private readonly logger = new Logger(GrpcAiController.name);
  private interviewService!: IGrpcInterviewService;
  private questionService!: IGrpcQuestionService;

  /**
   * Per-interview question cache so save_answer can look up the next question
   * without requiring the model to pass the full questions array every time.
   * Auto-cleaned after end_interview or after 2 hours.
   */
  private questionsCache = new Map<
    string,
    { questions: CachedQuestion[]; createdAt: number }
  >();

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

    setInterval(() => this.cleanExpiredCache(), 30 * 60 * 1000);
  }

  private cleanExpiredCache() {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [key, value] of this.questionsCache) {
      if (value.createdAt < twoHoursAgo) {
        this.questionsCache.delete(key);
      }
    }
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
        if (
          message.transcript &&
          (message.call as Record<string, unknown>)?.id
        ) {
          try {
            const callId = (message.call as Record<string, unknown>)
              .id as string;
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
    const {
      field,
      techStack,
      difficulty,
      userId: paramsUserId,
      interviewId,
    } = functionCall.parameters;

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

      let excludeIds: string[] = [];
      const realUserId = interview.userId;
      if (realUserId && realUserId !== "anonymous") {
        try {
          const prev = await firstValueFrom(
            this.interviewService.getUserInterviews({
              userId: realUserId,
              page: 1,
              limit: 50,
            }),
          );
          excludeIds = prev.interviews
            .flatMap((i) => i.questionIds || [])
            .filter(Boolean);
          if (excludeIds.length > 0) {
            this.logger.log(
              `Excluding ${excludeIds.length} previously seen questions`,
            );
          }
        } catch (e) {
          this.logger.warn(
            "Could not fetch previous interviews for exclusion",
            e,
          );
        }
      }

      let questions: {
        id?: string;
        content?: string;
        title?: string;
        question?: string;
        order?: number;
      }[] = [];
      try {
        const result = await firstValueFrom(
          this.questionService.getRandomQuestions({
            count: questionCount,
            category: field,
            difficulty,
            tags: (techStack || []).join(","),
            excludeIds,
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
        this.logger.log(
          `Only ${questions.length}/${questionCount} unique questions found, generating more via question-service...`,
        );
        try {
          await firstValueFrom(
            this.questionService.generateQuestions({
              field: field || "fullstack",
              techStack: techStack || [],
              difficulty: difficulty || "intermediate",
              count: questionCount * 2,
            }),
          );

          const retryResult = await firstValueFrom(
            this.questionService.getRandomQuestions({
              count: questionCount,
              category: field,
              difficulty,
              tags: (techStack || []).join(","),
              excludeIds,
            }),
          );
          questions = retryResult.questions || questions;
        } catch (e) {
          this.logger.error("question-service soru üretemedi", e);
        }
      }

      const formattedQuestions = questions
        .slice(0, questionCount)
        .map((q, index: number) => ({
          question: q.content || q.title || q.question || "",
          order: index + 1,
          sourceId: q.id || "",
        }));

      const questionIds = formattedQuestions
        .map((q) => q.sourceId)
        .filter(Boolean);

      await firstValueFrom(
        this.interviewService.startInterview({
          interviewId: interview.id,
          userId,
          questionIds,
        }),
      );

      const cachedQuestions: CachedQuestion[] = formattedQuestions.map((q) => ({
        id: q.sourceId,
        question: q.question,
        order: q.order,
      }));
      this.questionsCache.set(interview.id, {
        questions: cachedQuestions,
        createdAt: Date.now(),
      });

      return {
        result: {
          interviewId: interview.id,
          firstQuestion: formattedQuestions[0]?.question,
          totalQuestions: formattedQuestions.length,
          questions: formattedQuestions.map((q) => ({
            id: q.sourceId,
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
    const {
      interviewId,
      questionOrder,
      questionId: paramQuestionId,
      questionText,
      answer,
    } = functionCall.parameters;

    this.logger.log(
      `save_answer — interviewId: ${interviewId}, order: ${questionOrder}, ` +
        `questionId: ${paramQuestionId || "(none)"}, answer length: ${answer?.length || 0}`,
    );

    const cached = interviewId
      ? this.questionsCache.get(interviewId)
      : undefined;
    const cachedQuestions = cached?.questions || [];

    const currentQ = cachedQuestions.find(
      (q) => q.order === questionOrder,
    );
    const resolvedQuestionId =
      paramQuestionId || currentQ?.id || `q_${questionOrder}`;
    const resolvedQuestionText =
      questionText || currentQ?.question || `Soru ${questionOrder}`;

    try {
      await firstValueFrom(
        this.interviewService.submitAnswer({
          interviewId: interviewId || "",
          userId: headerUserId || "anonymous",
          questionId: resolvedQuestionId,
          questionTitle: resolvedQuestionText,
          answer: answer || "",
        }),
      );
      this.logger.log(
        `Answer saved for question ${questionOrder} (id: ${resolvedQuestionId})`,
      );
    } catch (error) {
      this.logger.warn(
        `Cevap kaydedilemedi: ${(error as Error)?.message || error}`,
      );
    }

    const currentOrder = questionOrder || 0;
    const nextQ = cachedQuestions.find((q) => q.order === currentOrder + 1);

    if (nextQ) {
      return {
        result: {
          saved: true,
          nextQuestion: nextQ.question,
          nextQuestionId: nextQ.id,
          nextQuestionOrder: nextQ.order,
          progress: `Soru ${nextQ.order} / ${cachedQuestions.length || 5}`,
        },
      };
    }

    if (currentOrder >= 5 || cachedQuestions.length <= currentOrder) {
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

  private async handleGetNextQuestion(functionCall: {
    name: string;
    parameters: FunctionCallParams;
  }): Promise<Record<string, unknown>> {
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

      // Layer 1: answers from DB (saved via save_answer calls)
      if (interviewData?.answers?.length) {
        answersForEval = interviewData.answers.map((a, idx: number) => ({
          question: a.questionTitle || `Soru ${idx + 1}`,
          answer: a.answer || "",
          order: idx + 1,
        }));
        this.logger.log(`${answersForEval.length} cevap DB'den alındı`);
      }

      // Layer 2: answers from function call params (sent by AI model)
      if (answersForEval.length === 0 && answers?.length) {
        answersForEval = answers.map((a, idx: number) => ({
          question: a.question || a.questionText || `Soru ${idx + 1}`,
          answer: a.answer || "",
          order: a.order || idx + 1,
        }));
        this.logger.log(
          `${answersForEval.length} cevap parametrelerden alındı`,
        );
      }

      // Layer 3: recover Q&A pairs from messages (last resort)
      if (answersForEval.length === 0 && interviewData?.messages?.length) {
        this.logger.log(
          `DB ve parametrelerde cevap yok, ${interviewData.messages.length} mesajdan recover ediliyor...`,
        );
        answersForEval = this.extractAnswersFromMessages(
          interviewData.messages,
        );
        this.logger.log(
          `${answersForEval.length} cevap messages'dan recover edildi`,
        );
      }

      const interviewField = interviewData?.field || "fullstack";
      const interviewTechStack = interviewData?.techStack || [];
      const interviewDifficulty = interviewData?.difficulty || "intermediate";

      if (answersForEval.length > 0) {
        this.logger.log(
          `Gemini değerlendirmesi başlatılıyor — ${answersForEval.length} cevap, alan: ${interviewField}`,
        );

        const evaluation = await this.geminiService.evaluateInterview({
          field: interviewField,
          techStack: interviewTechStack,
          difficulty: interviewDifficulty,
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
                questionEvaluations: evaluation.questionEvaluations || [],
              },
              overallFeedback: evaluation.summary,
            }),
          );
          this.logger.log(`Interview ${interviewId} report kaydedildi`);
        } catch (e) {
          this.logger.warn("Interview complete-with-report başarısız", e);
        }

        this.questionsCache.delete(interviewId || "");

        this.saveNovelQuestionsToPool(
          answersForEval,
          interviewField,
          interviewTechStack,
          interviewDifficulty,
        ).catch((e) =>
          this.logger.warn("Novel question saving failed", e),
        );

        return {
          result: {
            completed: true,
            overallScore: evaluation.overallScore,
            summary: evaluation.summary,
          },
        };
      }

      const messageCount = interviewData?.messages?.length ?? 0;
      const hasSubstantialConversation = messageCount >= 6;
      const statusText = hasSubstantialConversation
        ? "Mülakat tamamlandı ancak cevaplar ayrıştırılamadı. Lütfen tekrar deneyiniz."
        : "Mülakat erken sonlandırıldı veya hiç cevap verilmedi.";
      const rec = hasSubstantialConversation
        ? [
            "Mülakat sırasında cevaplarınız kaydedilemedi. Bu teknik bir sorun olabilir.",
            "Lütfen mülakatı tekrar deneyin.",
          ]
        : ["Mülakat pratiği yapmaya devam edin."];

      this.logger.warn(
        `Interview ${interviewId} — hiç cevap bulunamadı (messages: ${messageCount}), boş rapor gönderiliyor`,
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
              summary: statusText,
              recommendations: rec,
              questionEvaluations: [],
            },
            overallFeedback: statusText,
          }),
        );
      } catch (e) {
        this.logger.warn("Boş interview tamamlanamadı", e);
      }

      this.questionsCache.delete(interviewId || "");

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

  private async saveNovelQuestionsToPool(
    answersForEval: { question: string; answer: string; order: number }[],
    interviewField: string,
    interviewTechStack: string[],
    difficulty: string,
  ): Promise<void> {
    for (const a of answersForEval) {
      if (!a.question || a.question.length < 15) continue;
      try {
        await firstValueFrom(
          this.questionService.createQuestion({
            title: a.question.slice(0, 200),
            content: a.question,
            type: "technical",
            difficulty: difficulty || "",
            category: interviewField || "",
            tags: interviewTechStack || [],
          }),
        );
      } catch {
        // Duplicate or validation error — skip silently
      }
    }
    this.logger.log(
      `Attempted to save ${answersForEval.length} questions to pool for field=${interviewField}`,
    );
  }

  private extractAnswersFromMessages(
    messages: { role?: string; content?: string }[],
  ): { question: string; answer: string; order: number }[] {
    const results: { question: string; answer: string; order: number }[] = [];
    let pendingQuestion = "";
    let order = 0;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.content) continue;

      if (msg.role === "agent" && msg.content.includes("?")) {
        pendingQuestion = msg.content;
      } else if (msg.role === "user" && pendingQuestion) {
        let fullAnswer = msg.content;
        while (
          i + 1 < messages.length &&
          messages[i + 1].role === "user" &&
          messages[i + 1].content
        ) {
          i++;
          fullAnswer += " " + messages[i].content;
        }

        order++;
        results.push({
          question: pendingQuestion,
          answer: fullAnswer,
          order,
        });
        pendingQuestion = "";
      }
    }

    return results;
  }
}
