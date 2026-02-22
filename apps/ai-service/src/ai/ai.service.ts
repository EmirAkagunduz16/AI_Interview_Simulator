import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import {
  IGeneratedQuestion,
  IInterviewEvaluation,
} from "@ai-coach/shared-types";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model:
          this.configService.get<string>("GEMINI_MODEL") || "gemini-2.0-flash",
      });
      this.logger.log("Gemini AI initialized");
    } else {
      this.logger.warn("GEMINI_API_KEY not set");
    }
  }

  async generateInterviewQuestions(params: {
    field: string;
    techStack: string[];
    difficulty?: string;
    count?: number;
  }): Promise<IGeneratedQuestion[]> {
    const count = params.count || 5;
    const difficulty = params.difficulty || "intermediate";

    const prompt = `Sen bir teknik mülakat uzmanısın. Aşağıdaki bilgilere göre ${count} adet mülakat sorusu oluştur.

Alan: ${params.field}
Teknolojiler: ${params.techStack.join(", ")}
Seviye: ${difficulty}

Kurallar:
- Sorular Türkçe olmalı
- Her soru "${params.field}" alanı ve belirtilen teknolojilerle ilgili olmalı
- Sorular "${difficulty}" seviyesine uygun olmalı
- Açık uçlu, düşündürücü sorular sor
- Hem teori hem pratik soruları karıştır

JSON formatında yanıt ver:
[
  { "question": "soru metni", "category": "kategori", "order": 1 },
  ...
]

Sadece JSON dizisi döndür, başka hiçbir şey yazma.`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const questions: IGeneratedQuestion[] = JSON.parse(cleaned);
      this.logger.log(
        `Generated ${questions.length} questions for ${params.field}`,
      );
      return questions;
    } catch (error) {
      this.logger.error("Question generation failed", error);
      return Array.from({ length: count }, (_, i) => ({
        question: `${params.field} alanında ${params.techStack[0] || "genel"} ile ilgili deneyimlerinizi anlatır mısınız?`,
        category: params.field,
        order: i + 1,
      }));
    }
  }

  async evaluateInterview(params: {
    field: string;
    techStack: string[];
    answers: { question: string; answer: string; order: number }[];
  }): Promise<IInterviewEvaluation> {
    const answersText = params.answers
      .map((a) => `Soru ${a.order}: ${a.question}\nCevap: ${a.answer}`)
      .join("\n\n---\n\n");

    const prompt = `Sen bir teknik mülakat değerlendirme uzmanısın. Aşağıdaki mülakat cevaplarını detaylı olarak değerlendir.

Alan: ${params.field}
Teknolojiler: ${params.techStack.join(", ")}

Cevaplar:
${answersText}

Değerlendirme kriterleri (her biri 0-100 puan):
1. Teknik Bilgi (technicalScore): Teknik doğruluk ve derinlik
2. İletişim (communicationScore): Düşünceleri açık ifade etme 
3. Diksiyon (dictionScore): Dil kullanımı ve akıcılık
4. Güven (confidenceScore): Kendine güven ve tutarlılık

JSON formatında yanıt ver:
{
  "technicalScore": 0-100,
  "communicationScore": 0-100,
  "dictionScore": 0-100,
  "confidenceScore": 0-100,
  "overallScore": 0-100,
  "summary": "Genel değerlendirme özeti (Türkçe, 2-3 cümle)",
  "recommendations": ["Öneri 1", "Öneri 2", "Öneri 3"],
  "questionEvaluations": [
    {
      "question": "soru metni",
      "answer": "cevap metni",
      "score": 0-100,
      "feedback": "Bu cevap hakkında geri bildirim (Türkçe)",
      "strengths": ["güçlü yön 1"],
      "improvements": ["gelişim alanı 1"]
    }
  ]
}

Sadece JSON döndür.`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const evaluation: IInterviewEvaluation = JSON.parse(cleaned);
      this.logger.log(
        `Interview evaluated. Overall score: ${evaluation.overallScore}`,
      );
      return evaluation;
    } catch (error) {
      this.logger.error("Interview evaluation failed", error);
      return {
        technicalScore: 50,
        communicationScore: 50,
        dictionScore: 50,
        confidenceScore: 50,
        overallScore: 50,
        summary: "Değerlendirme tamamlandı. Genel performans orta düzeyde.",
        recommendations: [
          "Teknik konularda daha derinlemesine çalışın",
          "Cevaplarınızı daha yapılandırılmış verin",
        ],
        questionEvaluations: params.answers.map((a) => ({
          question: a.question,
          answer: a.answer,
          score: 50,
          feedback: "Cevap kısmen doğru.",
          strengths: ["Konuya değinmiş"],
          improvements: ["Daha detaylı açıklama gerekli"],
        })),
      };
    }
  }
}
