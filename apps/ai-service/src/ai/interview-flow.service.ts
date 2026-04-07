import { Injectable, Logger, Inject, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import {
  GRPC_INTERVIEW_SERVICE,
  GRPC_QUESTION_SERVICE,
  IGrpcInterviewService,
  IGrpcQuestionService,
  InterviewResponse,
} from "@ai-coach/grpc";
import {
  InterviewStatus,
  mapInterviewDifficultyToQuestionDifficulty,
} from "@ai-coach/shared-types";
import { CachedQuestion, VapiFunctionCallParams } from "./types";
import { RedisService } from "../common/redis/redis.service";

@Injectable()
export class InterviewFlowService implements OnModuleInit {
  private readonly logger = new Logger(InterviewFlowService.name);
  private interviewService!: IGrpcInterviewService;
  private questionService!: IGrpcQuestionService;

  constructor(
    @Inject(GRPC_INTERVIEW_SERVICE) private readonly interviewGrpc: ClientGrpc,
    @Inject(GRPC_QUESTION_SERVICE) private readonly questionGrpc: ClientGrpc,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.interviewService =
      this.interviewGrpc.getService<IGrpcInterviewService>("InterviewService");
    this.questionService =
      this.questionGrpc.getService<IGrpcQuestionService>("QuestionService");
  }

  // ── Cache helpers (Redis-backed) ───────────────────────────────────

  async getCachedQuestions(interviewId: string): Promise<CachedQuestion[]> {
    const cached =
      await this.redisService.getCachedInterviewQuestions(interviewId);
    return cached || [];
  }

  async deleteCachedQuestions(interviewId: string): Promise<void> {
    await this.redisService.deleteCachedInterviewQuestions(interviewId);
  }

  // ── save_preferences ───────────────────────────────────────────────

  async handleSavePreferences(
    params: VapiFunctionCallParams,
    callId?: string,
    headerUserId?: string,
  ): Promise<Record<string, unknown>> {
    const { field, techStack, difficulty, userId: paramsUserId, interviewId } =
      params;
    const userId = headerUserId || paramsUserId || "anonymous";
    const questionCount = 5;

    try {
      let interview: InterviewResponse;
      if (interviewId) {
        interview = await firstValueFrom(
          this.interviewService.getInterview({ interviewId, userId }),
        );
        // Oturum zaten başlamışsa (ör. save_preferences tekrar çağrıldıysa) yeniden
        // startInterview yapma — Redis'teki soruları dön.
        if (interview.status === InterviewStatus.IN_PROGRESS) {
          const cached = await this.getCachedQuestions(interviewId);
          if (cached.length > 0) {
            const firstQ = cached[0]?.question || "";
            this.logger.log(
              `save_preferences idempotent — interview ${interviewId} already in progress`,
            );
            return {
              result: {
                interviewId: interview.id,
                firstQuestion: firstQ,
                totalQuestions: cached.length,
                questions: cached,
                message: `${cached.length} soru (devam eden oturum).`,
                activeQuestionForRepeat: firstQ,
              },
            };
          }
        }
      } else {
        this.logger.warn(
          "save_preferences without interviewId — creating new interview; client should send pre-created interviewId to avoid duplicates",
        );
        const createField = field || "fullstack";
        interview = await firstValueFrom(
          this.interviewService.createInterview({
            userId,
            field: createField,
            techStack: techStack || [],
            difficulty: difficulty || "intermediate",
            title: `${createField} Developer Interview`,
            questionCount,
            vapiCallId: callId,
          }),
        );
      }

      const resolvedField = interview.field || field || "fullstack";
      const resolvedTechStack =
        interview.techStack?.length ? interview.techStack : techStack || [];
      const resolvedDifficulty =
        interview.difficulty || difficulty || "intermediate";

      const excludeIds = await this.getPreviousQuestionIds(interview.userId);
      const questions = await this.fetchQuestions(
        resolvedField,
        resolvedDifficulty,
        resolvedTechStack,
        questionCount,
        excludeIds,
      );

      const formattedQuestions = questions
        .slice(0, questionCount)
        .map((q, index) => ({
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

      await this.redisService.cacheInterviewQuestions(
        interview.id,
        cachedQuestions,
      );

      const firstQ = formattedQuestions[0]?.question || "";
      return {
        result: {
          interviewId: interview.id,
          firstQuestion: firstQ,
          totalQuestions: formattedQuestions.length,
          questions: cachedQuestions,
          message: `${formattedQuestions.length} soru hazırlandı. İlk soru ile başlıyoruz.`,
          /** "Tekrar sor" için: yalnızca bu metni kullan (ilk ana soru) */
          activeQuestionForRepeat: firstQ,
        },
      };
    } catch (error) {
      this.logger.error(
        `save_preferences failed: ${(error as Error)?.message || error}`,
        (error as Error)?.stack || "",
      );
      return {
        result: { error: "Mülakat oluşturulamadı, lütfen tekrar deneyin." },
      };
    }
  }

  // ── save_answer ────────────────────────────────────────────────────

  async handleSaveAnswer(
    params: VapiFunctionCallParams,
    headerUserId?: string,
  ): Promise<Record<string, unknown>> {
    const {
      interviewId,
      questionOrder,
      questionId: paramQuestionId,
      questionText,
      answer,
    } = params;

    this.logger.log(
      `save_answer — interview: ${interviewId}, order: ${questionOrder}, ` +
        `questionId: ${paramQuestionId || "(none)"}, answer length: ${answer?.length || 0}`,
    );

    const cachedQuestions = interviewId
      ? await this.getCachedQuestions(interviewId)
      : [];
    const currentQ = cachedQuestions.find((q) => q.order === questionOrder);
    const resolvedQuestionId =
      paramQuestionId || currentQ?.id || `q_${questionOrder}`;
    const resolvedQuestionText =
      questionText || currentQ?.question || `Soru ${questionOrder}`;

    this.saveQuestionToPool(
      resolvedQuestionText,
      interviewId || "",
    ).catch((e) =>
      this.logger.warn(`saveQuestionToPool failed: ${(e as Error)?.message}`),
    );

    let saveSuccess = true;
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
      saveSuccess = false;
      this.logger.error(
        `save_answer DB write failed — interview: ${interviewId}, ` +
          `question: ${questionOrder}: ${(error as Error)?.message || error}`,
      );
    }

    const currentOrder = questionOrder || 0;
    const nextQ = cachedQuestions.find((q) => q.order === currentOrder + 1);

    if (nextQ) {
      return {
        result: {
          saved: saveSuccess,
          nextQuestion: nextQ.question,
          nextQuestionId: nextQ.id,
          nextQuestionOrder: nextQ.order,
          progress: `Soru ${nextQ.order} / ${cachedQuestions.length || 5}`,
          /** Bankadan gelen az önce cevaplanan ana soru (takip soruları değil) */
          bankQuestionAnswered: resolvedQuestionText,
          /**
           * Kullanıcı "tekrar sor" dediğinde seslendirilecek metin: yeni ana soru.
           * Alt soruları veya bir önceki turun son alt sorusunu tekrarlama.
           */
          activeQuestionForRepeat: nextQ.question,
        },
      };
    }

    if (currentOrder >= 5 || cachedQuestions.length <= currentOrder) {
      return {
        result: {
          saved: saveSuccess,
          finished: true,
          message:
            "Tüm sorular tamamlandı. Mülakatı bitirmek için end_interview çağır.",
          bankQuestionAnswered: resolvedQuestionText,
        },
      };
    }

    return {
      result: {
        saved: saveSuccess,
        bankQuestionAnswered: resolvedQuestionText,
        activeQuestionForRepeat: resolvedQuestionText,
      },
    };
  }

  // ── Save question to pool (during interview) ───────────────────────

  /**
   * Only save actual interview questions to the pool.
   * Skip greetings, conversational text, and AI responses.
   */
  private async saveQuestionToPool(
    questionText: string,
    interviewId: string,
  ): Promise<void> {
    if (!questionText || questionText.trim().length < 30) return;

    const text = questionText.trim();

    // Must contain a question mark — real questions always do
    if (!text.includes("?")) return;

    // Skip conversational / greeting / AI response patterns
    const skipPatterns = [
      /^merhaba/i,
      /^merhabalar/i,
      /^hos\s*geldin/i,
      /^hoş\s*geldin/i,
      /^selam/i,
      /^güzel\s+cevap/i,
      /^harika\s+cevap/i,
      /^doğru[,.\s]/i,
      /^evet[,.\s]/i,
      /^tam\s+olarak/i,
      /^kesinlikle/i,
      /^aynen/i,
      /^çok\s+iyi/i,
      /^çok\s+güzel/i,
      /^teşekkür/i,
      /^tebrik/i,
      /^bravo/i,
      /^mülakatınız/i,
      /^mülakat\s+deneyimi/i,
      /^bir\s+mülakat\s+deneyimi/i,
    ];

    if (skipPatterns.some((p) => p.test(text))) return;

    // Extract the actual question: find the last sentence with '?'
    const cleaned = InterviewFlowService.extractQuestion(text);
    if (!cleaned || cleaned.length < 20) return;

    let interview: InterviewResponse | null = null;
    try {
      interview = await firstValueFrom(
        this.interviewService.getInterview({ interviewId, userId: "" }),
      );
    } catch {
      return;
    }
    if (!interview) return;

    const field = interview.field || "";
    const techStack = interview.techStack || [];
    const difficulty = mapInterviewDifficultyToQuestionDifficulty(
      interview.difficulty || "",
    );

    try {
      await firstValueFrom(
        this.questionService.createQuestion({
          title: cleaned.slice(0, 200),
          content: cleaned,
          type: "technical",
          difficulty,
          category: field || "fullstack",
          tags: techStack || [],
        }),
      );
      this.logger.debug(`Question saved to pool: ${cleaned.slice(0, 50)}...`);
    } catch {
      // Duplicate or validation error — skip silently
    }
  }

  /**
   * Extracts the actual question from AI text that may contain
   * conversational prefixes like "Doğru, tam da bu yüzden... Peki X?"
   */
  private static extractQuestion(text: string): string {
    // Split by sentence boundaries and find sentences with '?'
    const sentences = text.split(/(?<=[.!?])\s+/);
    const questionSentences = sentences.filter((s) => s.includes("?"));

    if (questionSentences.length === 0) return "";

    // Take the first question sentence onward
    const firstQIdx = sentences.findIndex((s) => s.includes("?"));
    // Include context: take from 1 sentence before the question if it exists
    const startIdx = Math.max(0, firstQIdx - 1);
    let result = sentences.slice(startIdx).join(" ").trim();

    // Strip common AI prefixes
    const prefixes = [
      /^(?:peki|tamam|güzel|harika|evet|doğru|aynen|kesinlikle)[,.\s]+/i,
      /^(?:başlayalım|devam edelim|bir sonraki soru)[,.\s]+/i,
      /^(?:ilk|ikinci|üçüncü|sonraki|bir sonraki|son)\s+soru(?:m|muz)?[:\s]*/i,
      /^soru(?:m|muz)?\s*(?:\d+)?[:\s]*/i,
      /^(?:tam da bu yüzden)[,.\s]+/i,
      /^(?:çok iyi|çok güzel|güzel cevap|harika cevap)[,.\s]+/i,
    ];

    for (const p of prefixes) {
      result = result.replace(p, "");
    }

    result = result.trim();
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    return result;
  }

  // ── get_next_question ──────────────────────────────────────────────

  async handleGetNextQuestion(
    params: VapiFunctionCallParams,
  ): Promise<Record<string, unknown>> {
    const { currentOrder, questions } = params;

    if (questions && Array.isArray(questions)) {
      const nextQ = questions.find((q) => q.order === (currentOrder || 0) + 1);
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

  // ── Transcript dispatch ────────────────────────────────────────────

  async dispatchTranscript(
    callId: string,
    role: string,
    transcript: string,
  ): Promise<void> {
    try {
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
            role: role === "assistant" ? "agent" : "user",
            content: transcript,
          }),
        );
      }
    } catch (e) {
      this.logger.warn("Failed to dispatch transcript", e);
    }
  }

  // ── Internal helpers ───────────────────────────────────────────────

  private async getPreviousQuestionIds(userId: string): Promise<string[]> {
    if (!userId || userId === "anonymous") return [];
    try {
      const prev = await firstValueFrom(
        this.interviewService.getUserInterviews({
          userId,
          page: 1,
          limit: 50,
        }),
      );
      const ids = prev.interviews
        .flatMap((i) => i.questionIds || [])
        .filter(Boolean);
      if (ids.length > 0) {
        this.logger.log(`Excluding ${ids.length} previously seen questions`);
      }
      return ids;
    } catch (e) {
      this.logger.warn(
        "Could not fetch previous interviews for exclusion",
        e,
      );
      return [];
    }
  }

  private async fetchQuestions(
    field?: string,
    difficulty?: string,
    techStack?: string[],
    count = 5,
    excludeIds: string[] = [],
  ): Promise<
    {
      id?: string;
      content?: string;
      title?: string;
      question?: string;
    }[]
  > {
    let questions: {
      id?: string;
      content?: string;
      title?: string;
      question?: string;
    }[] = [];

    try {
      const result = await firstValueFrom(
        this.questionService.getRandomQuestions({
          count,
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

    if (questions.length < count) {
      this.logger.log(
        `Only ${questions.length}/${count} unique questions found, generating more...`,
      );
      try {
        await firstValueFrom(
          this.questionService.generateQuestions({
            field: field || "",
            techStack: techStack || [],
            difficulty: difficulty || "",
            count: count * 2,
          }),
        );
        const retryResult = await firstValueFrom(
          this.questionService.getRandomQuestions({
            count,
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

    return questions;
  }
}
