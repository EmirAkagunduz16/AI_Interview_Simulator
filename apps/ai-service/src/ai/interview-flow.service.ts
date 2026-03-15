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
import { mapInterviewDifficultyToQuestionDifficulty } from "@ai-coach/shared-types";
import { CachedQuestion, VapiFunctionCallParams } from "./types";

@Injectable()
export class InterviewFlowService implements OnModuleInit {
  private readonly logger = new Logger(InterviewFlowService.name);
  private interviewService!: IGrpcInterviewService;
  private questionService!: IGrpcQuestionService;

  private questionsCache = new Map<
    string,
    { questions: CachedQuestion[]; createdAt: number }
  >();

  constructor(
    @Inject(GRPC_INTERVIEW_SERVICE) private readonly interviewGrpc: ClientGrpc,
    @Inject(GRPC_QUESTION_SERVICE) private readonly questionGrpc: ClientGrpc,
  ) {}

  onModuleInit() {
    this.interviewService =
      this.interviewGrpc.getService<IGrpcInterviewService>("InterviewService");
    this.questionService =
      this.questionGrpc.getService<IGrpcQuestionService>("QuestionService");
    setInterval(() => this.cleanExpiredCache(), 30 * 60 * 1000);
  }

  // ── Cache helpers ──────────────────────────────────────────────────

  getCachedQuestions(interviewId: string): CachedQuestion[] {
    return this.questionsCache.get(interviewId)?.questions || [];
  }

  deleteCachedQuestions(interviewId: string): void {
    this.questionsCache.delete(interviewId);
  }

  private cleanExpiredCache() {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [key, value] of this.questionsCache) {
      if (value.createdAt < twoHoursAgo) {
        this.questionsCache.delete(key);
      }
    }
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
      } else {
        interview = await firstValueFrom(
          this.interviewService.createInterview({
            userId,
            field: field || "fullstack",
            techStack: techStack || [],
            difficulty: difficulty || "intermediate",
            title: `${field} Developer Interview`,
            questionCount,
            vapiCallId: callId,
          }),
        );
      }

      const excludeIds = await this.getPreviousQuestionIds(interview.userId);
      const questions = await this.fetchQuestions(
        field,
        difficulty,
        techStack,
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

      this.questionsCache.set(interview.id, {
        questions: formattedQuestions.map((q) => ({
          id: q.sourceId,
          question: q.question,
          order: q.order,
        })),
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
      ? this.getCachedQuestions(interviewId)
      : [];
    const currentQ = cachedQuestions.find((q) => q.order === questionOrder);
    const resolvedQuestionId =
      paramQuestionId || currentQ?.id || `q_${questionOrder}`;
    const resolvedQuestionText =
      questionText || currentQ?.question || `Soru ${questionOrder}`;

    // Save question to question_db during interview (for question pool)
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
        },
      };
    }

    return { result: { saved: saveSuccess } };
  }

  // ── Save question to pool (during interview) ───────────────────────

  private async saveQuestionToPool(
    questionText: string,
    interviewId: string,
  ): Promise<void> {
    if (!questionText || questionText.trim().length < 15) return;

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
          title: questionText.slice(0, 200),
          content: questionText,
          type: "technical",
          difficulty,
          category: field || "fullstack",
          tags: techStack || [],
        }),
      );
      this.logger.debug(`Question saved to pool: ${questionText.slice(0, 50)}...`);
    } catch {
      // Duplicate or validation error — skip silently
    }
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
