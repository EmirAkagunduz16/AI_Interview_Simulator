import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { IInterviewEvaluation } from "@ai-coach/shared-types";

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
          this.configService.get<string>("GEMINI_MODEL") ||
          "gemini-2.5-flash-preview-05-20",
      });
      this.logger.log("Gemini AI initialized for evaluation");
    } else {
      this.logger.warn("GEMINI_API_KEY not set");
    }
  }

  async evaluateInterview(params: {
    field: string;
    techStack: string[];
    difficulty: string;
    answers: { question: string; answer: string; order: number }[];
  }): Promise<IInterviewEvaluation> {
    const answersText = params.answers
      .map(
        (a) =>
          `### Soru ${a.order}:\n${a.question}\n\n### Adayın Cevabı:\n${a.answer}`,
      )
      .join("\n\n---\n\n");

    const prompt = `Sen dünya standartlarında bir teknik mülakat değerlendirme uzmanısın. Gerçek bir FAANG/büyük teknoloji şirketinde mülakatçı gibi değerlendir.

# MÜLAKAT BİLGİLERİ
- Alan: ${params.field}
- Teknolojiler: ${params.techStack.join(", ")}
- Beklenen Seviye: ${params.difficulty}

# ADAY CEVAPLARI
${answersText}

# DEĞERLENDİRME KRİTERLERİ

Her kriteri 0-100 arasında puanla. Gerçekçi ol — mükemmel cevap yoksa 90+ verme.

## 1. Teknik Bilgi (technicalScore)
- Kavramların doğru anlaşılıp anlaşılmadığı
- Teknik terminolojinin doğru kullanımı
- Derinlik: Yüzeysel mi yoksa altyapıyı anlayarak mı cevap vermiş?
- Pratik deneyim işaretleri (gerçek projelerden örnekler vs.)
- Eksik veya yanlış bilgi var mı?
- 0-30: Ciddi bilgi eksikleri, temel kavramları bilmiyor
- 31-50: Yüzeysel bilgi, ezberci cevaplar
- 51-70: Orta düzey, kavramları biliyor ama derinlik eksik
- 71-85: İyi düzey, detaylı ve doğru cevaplar
- 86-100: Mükemmel, derin anlayış ve pratik deneyim

## 2. İletişim (communicationScore)
- Düşüncelerini yapılandırılmış şekilde ifade edebiliyor mu?
- Karmaşık konuları anlaşılır şekilde açıklayabiliyor mu?
- Sorulara doğrudan mı yoksa dolambaçlı mı cevap veriyor?

## 3. Diksiyon (dictionScore)
- Teknik terimleri doğru kullanıyor mu?
- Cümleleri akıcı ve anlaşılır mı?
- Gereksiz dolgu kelimeleri veya tekrarlar var mı?

## 4. Özgüven (confidenceScore)
- Cevaplarında tutarlı mı?
- "Bilmiyorum" dediği yerlerde dürüst mü?
- Emin olmadığı yerlerde spekülasyon mu yapıyor yoksa belirtiyor mu?

## 5. Genel Puan (overallScore)
- Tüm kriterlerin ağırlıklı ortalaması: Teknik %40, İletişim %25, Diksiyon %15, Özgüven %20
- "${params.difficulty}" seviyesine göre beklentileri karşılıyor mu?

# SORU BAZLI DEĞERLENDİRME
Her soru için ayrı ayrı değerlendir:
- score: 0-100 arası puan
- feedback: 2-4 cümle detaylı geri bildirim (Türkçe). Neyi iyi yaptı, neyi eksik bıraktı, ne söylemeliydi?
- strengths: Güçlü yönler listesi (en az 1)
- improvements: Gelişim alanları listesi (en az 1)

# ÖNERİLER
En az 3, en fazla 6 somut ve uygulanabilir öneri yaz. "Daha fazla çalışın" gibi genel öneriler YAZMA.
Her öneri spesifik olmalı: Hangi konu, hangi kaynak, ne yapmalı?

# ÇIKTI FORMATI
Sadece aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "technicalScore": 0-100,
  "communicationScore": 0-100,
  "dictionScore": 0-100,
  "confidenceScore": 0-100,
  "overallScore": 0-100,
  "summary": "3-5 cümlelik genel değerlendirme özeti (Türkçe). Adayın güçlü ve zayıf yönlerini belirt.",
  "recommendations": ["Spesifik öneri 1", "Spesifik öneri 2", "Spesifik öneri 3"],
  "questionEvaluations": [
    {
      "question": "Sorunun tam metni",
      "answer": "Adayın cevabının özeti",
      "score": 0-100,
      "feedback": "Detaylı geri bildirim (Türkçe)",
      "strengths": ["Güçlü yön"],
      "improvements": ["Gelişim alanı"]
    }
  ]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const evaluation: IInterviewEvaluation = JSON.parse(cleaned);

      evaluation.overallScore = Math.max(
        0,
        Math.min(100, Math.round(evaluation.overallScore)),
      );
      evaluation.technicalScore = Math.max(
        0,
        Math.min(100, Math.round(evaluation.technicalScore)),
      );
      evaluation.communicationScore = Math.max(
        0,
        Math.min(100, Math.round(evaluation.communicationScore)),
      );
      evaluation.dictionScore = Math.max(
        0,
        Math.min(100, Math.round(evaluation.dictionScore)),
      );
      evaluation.confidenceScore = Math.max(
        0,
        Math.min(100, Math.round(evaluation.confidenceScore)),
      );

      this.logger.log(
        `Interview evaluated — overall: ${evaluation.overallScore}, tech: ${evaluation.technicalScore}, ` +
          `comm: ${evaluation.communicationScore}, dict: ${evaluation.dictionScore}, conf: ${evaluation.confidenceScore}`,
      );
      return evaluation;
    } catch (error) {
      this.logger.error("Interview evaluation failed", error);
      return {
        technicalScore: 0,
        communicationScore: 0,
        dictionScore: 0,
        confidenceScore: 0,
        overallScore: 0,
        summary:
          "Değerlendirme sırasında teknik bir sorun oluştu. Lütfen mülakatı tekrar deneyin.",
        recommendations: [
          "Teknik bir sorun nedeniyle değerlendirme yapılamadı.",
          "Lütfen mülakatı tekrar deneyin.",
        ],
        questionEvaluations: params.answers.map((a) => ({
          question: a.question,
          answer: a.answer,
          score: 0,
          feedback: "Değerlendirme yapılamadı.",
          strengths: [],
          improvements: [],
        })),
      };
    }
  }
}
