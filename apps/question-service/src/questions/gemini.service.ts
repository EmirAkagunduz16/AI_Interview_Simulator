import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

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
}
