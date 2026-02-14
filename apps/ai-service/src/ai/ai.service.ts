import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private model: GenerativeModel | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>("gemini.apiKey");
    const modelName = this.configService.get<string>(
      "gemini.model",
      "gemini-2.0-flash",
    );

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: modelName });
      this.logger.log(`Gemini initialized with model: ${modelName}`);
    } else {
      this.logger.warn("Gemini API key not configured — AI features disabled");
    }
  }

  private ensureInitialized(): GenerativeModel {
    if (!this.model) {
      throw new Error("Gemini not initialized — missing API key");
    }
    return this.model;
  }

  async generateInterviewQuestions(params: {
    field: string;
    techStack?: string[];
    difficulty?: string;
    count?: number;
  }): Promise<
    { question: string; order: number; expectedKeyPoints?: string[] }[]
  > {
    const model = this.ensureInitialized();
    const count = params.count || 5;
    const difficulty = params.difficulty || "intermediate";
    const techStackStr = params.techStack?.join(", ") || params.field;

    const prompt = `Sen deneyimli bir yazılım mühendisi mülakat uzmanısın. Türkçe olarak ${count} adet ${difficulty} seviye mülakat sorusu oluştur.

Alan: ${params.field}
Teknolojiler: ${techStackStr}
Zorluk: ${difficulty}

Kurallar:
- Sorular Türkçe olmalıdır
- Her soru teknik bilgiyi test etmelidir
- Sorular pratik ve gerçek dünya senaryolarına dayalı olmalıdır
- Açık uçlu sorular olmalı, evet/hayır soruları olmamalı
- Sorular kolaydan zora doğru sıralanmalıdır

Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir şey yazma:
[
  {
    "question": "Soru metni",
    "order": 1,
    "expectedKeyPoints": ["beklenen anahtar nokta 1", "beklenen anahtar nokta 2"]
  }
]`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Could not parse Gemini response as JSON");
      }

      const questions = JSON.parse(jsonMatch[0]);
      return questions.map((q: any, i: number) => ({
        question: q.question,
        order: q.order || i + 1,
        expectedKeyPoints: q.expectedKeyPoints || [],
      }));
    } catch (error) {
      this.logger.error("Question generation failed", error);
      throw new Error("Failed to generate interview questions");
    }
  }

  async evaluateInterview(params: {
    field: string;
    techStack?: string[];
    answers: { question: string; answer: string; order?: number }[];
  }): Promise<{
    technicalScore: number;
    communicationScore: number;
    dictionScore: number;
    confidenceScore: number;
    overallScore: number;
    summary: string;
    recommendations: string[];
    questionEvaluations: {
      question: string;
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    }[];
  }> {
    const model = this.ensureInitialized();
    const techStackStr = params.techStack?.join(", ") || params.field;

    const answersText = params.answers
      .map(
        (a, i) =>
          `Soru ${i + 1}: ${a.question}\nCevap: ${a.answer || "(Cevaplanmadı)"}`,
      )
      .join("\n\n");

    const prompt = `Sen deneyimli bir mülakat değerlendirme uzmanısın. Aşağıdaki ${params.field} (${techStackStr}) alanındaki mülakat cevaplarını Türkçe olarak değerlendir.

${answersText}

Her bir cevabı ve genel performansı değerlendir. Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:

{
  "technicalScore": <0-100 arası teknik bilgi puanı>,
  "communicationScore": <0-100 arası iletişim becerisi puanı>,
  "dictionScore": <0-100 arası diksiyon/ifade kalitesi puanı>,
  "confidenceScore": <0-100 arası güven/tutarlılık puanı>,
  "overallScore": <0-100 arası genel puan>,
  "summary": "<Türkçe genel değerlendirme özeti>",
  "recommendations": ["<Türkçe öneri 1>", "<Türkçe öneri 2>"],
  "questionEvaluations": [
    {
      "question": "<soru metni>",
      "score": <0-100>,
      "feedback": "<Türkçe geri bildirim>",
      "strengths": ["<güçlü yön 1>"],
      "improvements": ["<geliştirilecek yön 1>"]
    }
  ]
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse Gemini evaluation response");
      }

      const evaluation = JSON.parse(jsonMatch[0]);

      return {
        technicalScore: Math.min(
          100,
          Math.max(0, evaluation.technicalScore || 50),
        ),
        communicationScore: Math.min(
          100,
          Math.max(0, evaluation.communicationScore || 50),
        ),
        dictionScore: Math.min(100, Math.max(0, evaluation.dictionScore || 50)),
        confidenceScore: Math.min(
          100,
          Math.max(0, evaluation.confidenceScore || 50),
        ),
        overallScore: Math.min(100, Math.max(0, evaluation.overallScore || 50)),
        summary: evaluation.summary || "Değerlendirme tamamlandı.",
        recommendations: evaluation.recommendations || [],
        questionEvaluations: evaluation.questionEvaluations || [],
      };
    } catch (error) {
      this.logger.error("Interview evaluation failed", error);
      throw new Error("Failed to evaluate interview");
    }
  }
}
