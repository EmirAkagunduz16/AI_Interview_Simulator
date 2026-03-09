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
import { GeminiService } from "./ai.service";
import { InterviewFlowService } from "./interview-flow.service";
import { VapiFunctionCallParams } from "./types";

@Injectable()
export class InterviewEvaluationService implements OnModuleInit {
  private readonly logger = new Logger(InterviewEvaluationService.name);
  private interviewService!: IGrpcInterviewService;
  private questionService!: IGrpcQuestionService;

  constructor(
    private readonly geminiService: GeminiService,
    private readonly flowService: InterviewFlowService,
    @Inject(GRPC_INTERVIEW_SERVICE) private readonly interviewGrpc: ClientGrpc,
    @Inject(GRPC_QUESTION_SERVICE) private readonly questionGrpc: ClientGrpc,
  ) {}

  onModuleInit() {
    this.interviewService =
      this.interviewGrpc.getService<IGrpcInterviewService>("InterviewService");
    this.questionService =
      this.questionGrpc.getService<IGrpcQuestionService>("QuestionService");
  }

  // ── end_interview ──────────────────────────────────────────────────

  async handleEndInterview(
    params: Pick<VapiFunctionCallParams, "interviewId" | "answers">,
    headerUserId?: string,
  ): Promise<Record<string, unknown>> {
    const { interviewId, answers } = params;

    this.logger.log(
      `end_interview — interviewId: ${interviewId}, userId: ${headerUserId || "(empty)"}, ` +
        `answers from params: ${answers?.length ?? 0}`,
    );

    try {
      const interviewData = await this.fetchInterviewWithRetry(
        interviewId || "",
      );

      // Idempotency: if already completed, return existing result
      if (interviewData?.status === "completed") {
        this.logger.log(
          `Interview ${interviewId} already completed, returning existing result`,
        );
        this.flowService.deleteCachedQuestions(interviewId || "");
        return {
          result: {
            completed: true,
            overallScore: interviewData.report?.overallScore ?? 0,
            summary: interviewData.report?.summary || "Mülakat tamamlandı.",
          },
        };
      }

      const answersForEval = this.collectAnswers(interviewData, answers);
      const interviewField = interviewData?.field || "";
      const interviewTechStack = interviewData?.techStack || [];
      const interviewDifficulty = interviewData?.difficulty || "";

      if (answersForEval.length > 0) {
        return this.evaluateAndSaveReport(
          interviewId || "",
          answersForEval,
          interviewField,
          interviewTechStack,
          interviewDifficulty,
        );
      }

      return this.saveEmptyReport(interviewId || "", interviewData);
    } catch (error) {
      this.logger.error("end_interview failed", error);
      return { result: { completed: true, message: "Mülakat tamamlandı." } };
    }
  }

  // ── end-of-call safety net ─────────────────────────────────────────
  // If the Vapi call ends (disconnect, timeout, natural end) and the
  // interview was never completed, trigger evaluation as a safety net.

  async handleEndOfCall(message: Record<string, unknown>): Promise<void> {
    const call = message.call as Record<string, unknown> | undefined;
    const callId = call?.id as string | undefined;
    if (!callId) return;

    this.logger.log(`End of call received: ${callId}`);

    try {
      const interview = await firstValueFrom(
        this.interviewService.getInterviewByVapiCallId({
          vapiCallId: callId,
        }),
      );

      if (!interview?.id) return;

      if (interview.status === "completed" || interview.report) {
        this.logger.log(
          `Interview ${interview.id} already completed at end-of-call`,
        );
        return;
      }

      this.logger.log(
        `Interview ${interview.id} not completed at end-of-call, triggering safety net evaluation`,
      );
      await this.handleEndInterview(
        { interviewId: interview.id },
        interview.userId || undefined,
      );
    } catch (e) {
      this.logger.warn(`End-of-call safety net failed for call ${callId}`, e);
    }
  }

  // ── Evaluation pipeline ────────────────────────────────────────────

  private async evaluateAndSaveReport(
    interviewId: string,
    answersForEval: { question: string; answer: string; order: number }[],
    field: string,
    techStack: string[],
    difficulty: string,
  ): Promise<Record<string, unknown>> {
    this.logger.log(
      `Gemini evaluation starting — ${answersForEval.length} answers, field: ${field}`,
    );

    const evaluation = await this.geminiService.evaluateInterview({
      field,
      techStack,
      difficulty,
      answers: answersForEval,
    });

    this.logger.log(
      `Gemini evaluation done — overallScore: ${evaluation.overallScore}`,
    );

    try {
      await firstValueFrom(
        this.interviewService.completeWithReport({
          interviewId,
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
      this.logger.log(`Interview ${interviewId} report saved`);
    } catch (e) {
      this.logger.warn("completeWithReport failed", e);
    }

    this.flowService.deleteCachedQuestions(interviewId);

    this.saveNovelQuestionsToPool(
      answersForEval,
      field,
      techStack,
      difficulty,
    ).catch((e) => this.logger.warn("Novel question saving failed", e));

    return {
      result: {
        completed: true,
        overallScore: evaluation.overallScore,
        summary: evaluation.summary,
      },
    };
  }

  private async saveEmptyReport(
    interviewId: string,
    interviewData: InterviewResponse | null,
  ): Promise<Record<string, unknown>> {
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
      `Interview ${interviewId} — no answers found (messages: ${messageCount}), saving empty report`,
    );

    try {
      await firstValueFrom(
        this.interviewService.completeWithReport({
          interviewId,
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
      this.logger.warn("Empty report save failed", e);
    }

    this.flowService.deleteCachedQuestions(interviewId);
    return { result: { completed: true, message: "Mülakat tamamlandı." } };
  }

  // ── DB fetch with retry ────────────────────────────────────────────
  // Retries once after 2s if no answers found — handles the race
  // condition where the last save_answer hasn't been written yet.

  private async fetchInterviewWithRetry(
    interviewId: string,
  ): Promise<InterviewResponse | null> {
    const doFetch = async (): Promise<InterviewResponse | null> => {
      try {
        return await firstValueFrom(
          this.interviewService.getInterview({ interviewId, userId: "" }),
        );
      } catch (e) {
        this.logger.warn(
          `getInterview failed (${interviewId}): ${(e as Error)?.message || e}`,
        );
        return null;
      }
    };

    const first = await doFetch();
    if (first?.answers?.length) {
      this.logger.log(
        `Interview loaded — answers: ${first.answers.length}, field: ${first.field}, status: ${first.status}`,
      );
      return first;
    }

    this.logger.log(
      "No answers in DB on first try, waiting 2s for race condition...",
    );
    await new Promise((r) => setTimeout(r, 2000));

    const second = await doFetch();
    this.logger.log(
      `Retry result — answers: ${second?.answers?.length ?? 0}`,
    );
    return second ?? first;
  }

  // ── Answer collection & merge ──────────────────────────────────────
  // Merges answers from multiple sources in priority order:
  //  1. DB (save_answer writes) — most reliable
  //  2. Function call params (client accumulated answers) — fills gaps
  //  3. Conversation messages — last resort extraction

  private collectAnswers(
    interviewData: InterviewResponse | null,
    paramAnswers?: VapiFunctionCallParams["answers"],
  ): { question: string; answer: string; order: number }[] {
    const byOrder = new Map<
      number,
      { question: string; answer: string; order: number }
    >();

    const cachedQuestions = interviewData?.id
      ? this.flowService.getCachedQuestions(interviewData.id)
      : [];

    // Layer 1: DB answers (from save_answer)
    if (interviewData?.answers?.length) {
      for (let i = 0; i < interviewData.answers.length; i++) {
        const a = interviewData.answers[i];
        const order = i + 1;
        const cachedQ = cachedQuestions.find((q) => q.order === order);
        byOrder.set(order, {
          question: a.questionTitle || cachedQ?.question || `Soru ${order}`,
          answer: a.answer || "",
          order,
        });
      }
      this.logger.log(`Layer 1 (DB): ${byOrder.size} answers`);
    }

    // Layer 2: Function call params — fill missing orders only
    if (paramAnswers?.length) {
      let added = 0;
      for (const a of paramAnswers) {
        const order = a.order || 0;
        if (order > 0 && !byOrder.has(order) && a.answer) {
          byOrder.set(order, {
            question: a.question || a.questionText || `Soru ${order}`,
            answer: a.answer,
            order,
          });
          added++;
        }
      }
      if (added > 0) {
        this.logger.log(`Layer 2 (params): ${added} additional answers merged`);
      }
    }

    // Layer 3: Extract from conversation messages
    if (byOrder.size === 0 && interviewData?.messages?.length) {
      this.logger.log(
        `No structured answers, recovering from ${interviewData.messages.length} messages...`,
      );
      const recovered = this.extractAnswersFromMessages(
        interviewData.messages,
      );
      for (const r of recovered) {
        byOrder.set(r.order, r);
      }
      this.logger.log(`Layer 3 (messages): ${recovered.length} answers recovered`);
    }

    const result = Array.from(byOrder.values()).sort(
      (a, b) => a.order - b.order,
    );
    this.logger.log(`Total ${result.length} answers for evaluation`);
    return result;
  }

  // ── Novel question saving ──────────────────────────────────────────

  private async saveNovelQuestionsToPool(
    answersForEval: { question: string; answer: string; order: number }[],
    field: string,
    techStack: string[],
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
            category: field || "",
            tags: techStack || [],
          }),
        );
      } catch {
        // Duplicate or validation error — skip silently
      }
    }
    this.logger.log(
      `Saved ${answersForEval.length} questions to pool (field=${field})`,
    );
  }

  // ── Message extraction (last resort) ───────────────────────────────

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
        results.push({ question: pendingQuestion, answer: fullAnswer, order });
        pendingQuestion = "";
      }
    }

    return results;
  }
}
