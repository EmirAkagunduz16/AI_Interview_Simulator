import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { Difficulty } from "@ai-coach/shared-types";

interface GeneratedQuestion {
  title: string;
  content: string;
  sampleAnswer?: string;
}

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

    const prompt = `Sen bir teknik mülakat uzmanısın. Aşağıdaki bilgilere göre ${count} adet özgün mülakat sorusu oluştur.

Alan: ${field}
Teknolojiler: ${techStack.join(", ")}
Seviye: ${difficulty}

Kurallar:
- Sorular Türkçe olmalı
- Her soru "${field}" alanı ve belirtilen teknolojilerle doğrudan ilgili olmalı
- Sorular "${difficulty}" seviyesine uygun olmalı
- Açık uçlu, düşündürücü sorular sor
- Hem teori hem pratik soruları karıştır
- Her soru benzersiz olmalı, birbirine benzer sorular olmasın

JSON formatında yanıt ver:
[
  {
    "title": "Kısa soru başlığı",
    "content": "Tam soru metni — detaylı ve açıklayıcı",
    "sampleAnswer": "Beklenen cevabın özeti (2-3 cümle)"
  }
]

Sadece JSON dizisi döndür, başka hiçbir şey yazma.`;

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
   * Classifies the difficulty of a community-submitted question using Gemini.
   * Returns one of: easy | medium | hard. Falls back to "medium" on failure.
   */
  async classifyDifficulty(params: {
    content: string;
    field?: string;
    tags?: string[];
  }): Promise<Difficulty> {
    const { content, field, tags } = params;

    if (!content || content.trim().length < 10) {
      return Difficulty.MEDIUM;
    }

    const prompt = `Sen, deneyimli bir teknik mülakat uzmanısın. Sana verilen mülakat sorusunu okuyup zorluk seviyesini belirle.

Soru: """${content}"""
${field ? `Alan: ${field}` : ""}
${tags && tags.length ? `Teknolojiler: ${tags.join(", ")}` : ""}

Zorluk kriterleri (kim cevaplayabilir bakış açısıyla):
- "easy": Junior (0-2 yıl) seviyede; temel kavramlar, tanımlar, sözdizimi soruları.
- "medium": Mid-level (2-5 yıl) seviyede; kavramların derinlemesine kullanımı, mimari kararlar, pratik problemler.
- "hard": Senior (5+ yıl) seviyede; ileri düzey mimari, performans, edge case'ler, tradeoff analizleri, system design.

SADECE şu JSON'u döndür, başka hiçbir şey yazma:
{"difficulty": "easy" | "medium" | "hard"}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      const jsonStr =
        firstBrace !== -1 && lastBrace > firstBrace
          ? cleaned.slice(firstBrace, lastBrace + 1)
          : cleaned;
      const parsed = JSON.parse(jsonStr) as { difficulty?: string };
      const raw = (parsed.difficulty || "").toLowerCase().trim();

      if (raw === "easy") return Difficulty.EASY;
      if (raw === "hard") return Difficulty.HARD;
      if (raw === "medium") return Difficulty.MEDIUM;

      this.logger.warn(`Gemini returned unknown difficulty: "${raw}"`);
      return Difficulty.MEDIUM;
    } catch (error) {
      this.logger.warn(
        `Gemini classifyDifficulty failed, defaulting to medium: ${(error as Error)?.message}`,
      );
      return Difficulty.MEDIUM;
    }
  }
}
