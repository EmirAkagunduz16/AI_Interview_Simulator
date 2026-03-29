import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { IInterviewEvaluation } from "@ai-coach/shared-types";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>("GEMINI_API_KEY");

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: this.configService.getOrThrow<string>("GEMINI_MODEL"),
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
    /** Tam konuşma özeti — takip soruları ve netlik için (isteğe bağlı) */
    conversationTranscript?: string;
  }): Promise<IInterviewEvaluation> {
    const answersText = params.answers
      .map(
        (a) =>
          `### Ana soru ${a.order} (banka sorusu):\n${a.question}\n\n### Kayıtlı cevap özeti / birleşik metin:\n${a.answer}`,
      )
      .join("\n\n---\n\n");

    const transcriptSection =
      params.conversationTranscript?.trim() &&
      params.conversationTranscript.trim().length > 40
        ? `

# KONUŞMA TRANSKRİPTİ (tamamlayıcı bağlam)
Aşağıdaki satırlar mülakatın gerçek diyaloğundan kısaltılmış bir özetidir. Kayıtlı cevap metinleriyle çelişki varsa, **transkript + birleşik cevabı birlikte** yorumla.
Gerçek mülakat genelde her ana soru için takip (derinleştirici) sorular içerir; adayın teknik derinliğini hem ana hem takip turlarında nasıl gösterdiğine bak.

"""
${params.conversationTranscript.trim()}
"""
`
        : "";

    const prompt = `Sen dünya standartlarında bir teknik mülakat değerlendirme uzmanısın. Gerçek bir FAANG/büyük teknoloji şirketinde mülakatçı gibi değerlendir.

# MÜLAKAT BİLGİLERİ
- Alan: ${params.field}
- Teknolojiler: ${params.techStack.join(", ")}
- Beklenen Seviye: ${params.difficulty}

# YAPI NOTU
Bu oturumda **5 ana teknik soru** (bankadan) vardır. Adaya her ana soru için doğal **takip soruları** sorulmuş olabilir.
- "Kayıtlı cevap / birleşik metin" alanında \`---\` ile ayrılmış parçalar: aynı ana soruya bağlı birden fazla kayıt (ör. takip sorularına verilen özeti kapsayan) olabilir.
- **questionEvaluations** dizisinde tam olarak ${params.answers.length} öğe üret (her biri bir ana soru teması); takip turlarındaki performansı o temanın puanına yedir.
${transcriptSection}
# ADAY CEVAPLARI (kayıtlı)
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
Her **ana soru teması** için (${params.answers.length} adet) ayrı değerlendirme üret:
- score: 0-100 arası puan (takip diyaloğundaki netlik ve derinlik bu puana dâhil)
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
      const evaluation = this.parseGeminiJsonResponse(text);

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
      // If JSON parse error, retry once with a simpler prompt
      if (error instanceof SyntaxError) {
        this.logger.warn(
          "Gemini returned malformed JSON, retrying with simpler prompt...",
        );
        try {
          const retryResult = await this.model.generateContent(
            prompt +
              "\n\n⚠️ ÖNCEKİ YANITINDA JSON HATASI VARDI. LÜTFEN SADECE GEÇERLİ JSON DÖNDÜR, BAŞKA HİÇBİR ŞEY YAZMA. Yorum, açıklama, markdown formatı KULLANMA.",
          );
          const retryText = retryResult.response.text();
          const evaluation = this.parseGeminiJsonResponse(retryText);
          evaluation.overallScore = Math.max(0, Math.min(100, Math.round(evaluation.overallScore)));
          evaluation.technicalScore = Math.max(0, Math.min(100, Math.round(evaluation.technicalScore)));
          evaluation.communicationScore = Math.max(0, Math.min(100, Math.round(evaluation.communicationScore)));
          evaluation.dictionScore = Math.max(0, Math.min(100, Math.round(evaluation.dictionScore)));
          evaluation.confidenceScore = Math.max(0, Math.min(100, Math.round(evaluation.confidenceScore)));
          this.logger.log(
            `Retry succeeded — overall: ${evaluation.overallScore}`,
          );
          return evaluation;
        } catch (retryError) {
          this.logger.error("Retry also failed", retryError);
        }
      }

      this.logger.error("Interview evaluation failed", error);
      // Provide a basic fallback evaluation so user always sees results
      const hasContent = params.answers.some(
        (a) => (a.answer || "").trim().length > 10,
      );
      const summary = hasContent
        ? "Değerlendirme sırasında geçici bir sorun oluştu. Verdiğiniz cevaplar kaydedildi. Tam değerlendirme için lütfen mülakatı tekrar deneyin."
        : "Mülakat erken sonlandırıldı veya yeterli cevap alınamadı. Detaylı değerlendirme için tüm soruları yanıtlayarak mülakatı tamamlayın.";
      return {
        technicalScore: 0,
        communicationScore: 0,
        dictionScore: 0,
        confidenceScore: 0,
        overallScore: 0,
        summary,
        recommendations: [
          "Mülakatı baştan sona tamamlayarak daha kapsamlı geri bildirim alın.",
          "Her soruya mümkün olduğunca detaylı cevap verin.",
          "Teknik terimleri doğru kullanmaya özen gösterin.",
        ],
        questionEvaluations: params.answers.map((a) => ({
          question: a.question,
          answer: a.answer,
          score: 0,
          feedback: "Bu soru için değerlendirme tamamlanamadı.",
          strengths: [],
          improvements: [],
        })),
      };
    }
  }

  /** Extracts JSON from Gemini response, handling markdown fences and trailing text. */
  private parseGeminiJsonResponse(text: string): IInterviewEvaluation {
    let cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Try to extract JSON object if there's trailing text after it
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleaned);
  }
}
