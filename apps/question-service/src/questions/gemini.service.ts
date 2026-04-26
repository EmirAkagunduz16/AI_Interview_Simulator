import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GoogleGenerativeAI,
  GenerativeModel,
  SchemaType,
} from "@google/generative-ai";

import {
  GeneratedQuestion,
  QuestionClassification,
  VALID_CATEGORIES,
  VALID_DIFFICULTIES,
} from "./gemini.types";
import {
  buildGenerateQuestionsPrompt,
  buildClassifyQuestionPrompt,
} from "./gemini.prompts";
import {
  MOBILE_SIGNALS,
  DATA_SCIENCE_SIGNALS,
  DEVOPS_SIGNALS,
  FRONTEND_SIGNALS,
  BACKEND_SIGNALS,
  STRONG_MOBILE_SIGNALS,
  STRONG_DATA_SCIENCE_SIGNALS,
  SENIOR_SIGNALS,
  JUNIOR_DEFINITIVE_PATTERNS,
  JUNIOR_NEDIR_PATTERN,
  JUNIOR_NELERDIR_PATTERN,
  COMPARISON_OR_MECHANISM_TERMS,
} from "./gemini.signals";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey) {
      this.logger.error("GEMINI_API_KEY is required for question generation");
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model:
        this.configService.get<string>("GEMINI_MODEL") || "gemini-2.0-flash",
    });
    this.logger.log("Gemini AI initialized for question generation");
  }

  async generateQuestions(params: {
    field: string;
    techStack: string[];
    difficulty: string;
    count: number;
  }): Promise<GeneratedQuestion[]> {
    const { field, techStack, difficulty, count } = params;
    const prompt = buildGenerateQuestionsPrompt(field, techStack, difficulty, count);

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const questions: GeneratedQuestion[] = JSON.parse(cleaned);
      this.logger.log(
        `Generated ${questions.length} questions for ${field} (${difficulty})`,
      );
      return questions;
    } catch (error) {
      this.logger.error("Gemini question generation failed", error);
      throw error;
    }
  }

  /**
   * Classify a community-submitted question.
   * Determines field, difficulty, tags and a short title from the question content alone.
   *
   * Strategy:
   *  1. Compute heuristic category + difficulty as a safety net.
   *  2. Ask Gemini with a structured JSON schema so parsing never fails.
   *  3. Validate Gemini's output; fall back to heuristic if a value is invalid.
   *  4. Apply strong-signal overrides: when the heuristic detects an unambiguous
   *     domain (mobile, data_science) or difficulty (senior), it wins over Gemini.
   */
  async classifyQuestion(content: string): Promise<QuestionClassification> {
    const heuristicCategory = this.inferCategory(content);
    const heuristicDifficulty = this.inferDifficulty(content);

    try {
      const result = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: buildClassifyQuestionPrompt(content) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              category: {
                type: SchemaType.STRING,
                format: "enum",
                enum: [...VALID_CATEGORIES],
              },
              difficulty: {
                type: SchemaType.STRING,
                format: "enum",
                enum: [...VALID_DIFFICULTIES],
              },
              tags: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["title", "category", "difficulty", "tags"],
          },
        },
      });

      const text = result.response.text();
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleaned) as Partial<QuestionClassification>;

      let category = (VALID_CATEGORIES as readonly string[]).includes(
        parsed.category || "",
      )
        ? (parsed.category as string)
        : heuristicCategory;

      let difficulty = (VALID_DIFFICULTIES as readonly string[]).includes(
        parsed.difficulty || "",
      )
        ? (parsed.difficulty as string)
        : heuristicDifficulty;

      // Strong-signal overrides — heuristic wins when signals are unambiguous.
      const normalisedContent = content
        .toLowerCase()
        .replace(/react\s*native/gi, "reactnative");

      if (STRONG_MOBILE_SIGNALS.some((s) => normalisedContent.includes(s))) {
        category = "mobile";
      } else if (
        STRONG_DATA_SCIENCE_SIGNALS.some((s) => normalisedContent.includes(s))
      ) {
        category = "data_science";
      }

      if (heuristicDifficulty === "senior" && difficulty !== "senior") {
        this.logger.warn(
          `Difficulty override: Gemini="${difficulty}" but strong senior signals found → "senior"`,
        );
        difficulty = "senior";
      }

      // Junior override: heuristic pattern is definitive, Gemini defaulted to intermediate.
      if (heuristicDifficulty === "junior" && difficulty === "intermediate") {
        this.logger.log(
          `Difficulty override: Gemini="intermediate" but junior linguistic patterns matched → "junior"`,
        );
        difficulty = "junior";
      }

      const tags = Array.isArray(parsed.tags)
        ? parsed.tags
            .map((t) => String(t).trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];

      const title =
        (parsed.title || "").toString().trim().slice(0, 120) ||
        content.slice(0, 80).trim();

      this.logger.log(
        `Classified — category=${category}, difficulty=${difficulty}, tags=[${tags.join(", ")}]`,
      );

      return { title, category, difficulty, tags };
    } catch (error) {
      this.logger.warn(
        `Gemini classify failed, using heuristics: ${(error as Error).message}`,
      );
      return {
        title: content.slice(0, 80).trim() || "Topluluk sorusu",
        category: heuristicCategory,
        difficulty: heuristicDifficulty,
        tags: [],
      };
    }
  }

  /**
   * Heuristic category inference.
   * Priority order: mobile → data_science → devops → frontend / fullstack → backend.
   */
  private inferCategory(content: string): string {
    const lower = content.toLowerCase();
    const normalised = lower.replace(/react\s*native/g, "reactnative");

    if (MOBILE_SIGNALS.some((k) => normalised.includes(k))) return "mobile";
    if (DATA_SCIENCE_SIGNALS.some((k) => lower.includes(k))) return "data_science";
    if (DEVOPS_SIGNALS.some((k) => lower.includes(k))) return "devops";

    const frontendScore = FRONTEND_SIGNALS.filter((k) =>
      lower.includes(k),
    ).length;
    const backendScore = BACKEND_SIGNALS.filter((k) =>
      lower.includes(k),
    ).length;

    if (frontendScore >= 1 && backendScore >= 1) return "fullstack";
    if (frontendScore > 0) return "frontend";

    return "backend";
  }

  /**
   * Heuristic difficulty inference based on Turkish question grammar — no length gate.
   *
   * Decision order:
   *   1. Senior  — strong domain signals (distributed systems, cryptographic protocols, etc.)
   *   2. Junior  — definitive linguistic forms: "X nedir?", "X nedir ve nasıl çalışır?",
   *                "X ne demek?", "nelerdir?" etc. UNLESS the question is actually asking
   *                about a mechanism comparison or a design decision.
   *   3. Intermediate — everything else.
   */
  private inferDifficulty(content: string): string {
    const lower = content.toLowerCase();

    // ── 1. Senior ────────────────────────────────────────────────────────
    if (SENIOR_SIGNALS.some((s) => lower.includes(s))) return "senior";

    // ── 2. Junior — definitive patterns (length-independent) ─────────────
    // These forms are unambiguously definitional regardless of question length.
    if (JUNIOR_DEFINITIVE_PATTERNS.some((p) => p.test(content))) return "junior";

    // "X nedir?" or "X nelerdir?" at the end — junior UNLESS the question
    // contains comparison or mechanism markers.
    const hasComparisonOrMechanism = COMPARISON_OR_MECHANISM_TERMS.some((t) =>
      lower.includes(t),
    );
    if (!hasComparisonOrMechanism) {
      if (JUNIOR_NEDIR_PATTERN.test(lower)) return "junior";
      if (JUNIOR_NELERDIR_PATTERN.test(lower)) return "junior";
    }

    // ── 3. Default ───────────────────────────────────────────────────────
    return "intermediate";
  }
}
