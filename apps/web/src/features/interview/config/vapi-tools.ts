/**
 * VAPI tool (function) definitions for the interview assistant.
 * Each tool is called by the AI during the interview flow.
 */

export function buildVapiTools(interviewId: string) {
  return [
    {
      type: "function" as const,
      function: {
        name: "save_preferences",
        description:
          "Mülakat başlangıcında tercihleri kaydet ve soruları oluştur. Kullanıcı hazır olduğunda çağır.",
        parameters: {
          type: "object",
          properties: {
            field: { type: "string", description: "Mülakat alanı" },
            techStack: {
              type: "array",
              items: { type: "string" },
              description: "Teknoloji listesi",
            },
            difficulty: { type: "string", description: "Zorluk seviyesi" },
            interviewId: {
              type: "string",
              description: `Mülakat ID. Her zaman "${interviewId}" olmalı.`,
            },
          },
          required: ["field", "interviewId"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "save_answer",
        description:
          "Kullanıcının cevabını kaydet ve sonraki soruyu al. Her cevaptan sonra çağır.",
        parameters: {
          type: "object",
          properties: {
            questionOrder: {
              type: "number",
              description: "Şu anki sorunun sıra numarası (1-5)",
            },
            questionText: {
              type: "string",
              description: "Sorulan sorunun metni",
            },
            answer: {
              type: "string",
              description: "Kullanıcının verdiği cevap",
            },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  order: { type: "number" },
                },
              },
              description:
                "save_preferences fonksiyonundan dönen soru listesinin tamamı",
            },
            interviewId: {
              type: "string",
              description: `Mülakat ID. Her zaman "${interviewId}" olmalı.`,
            },
          },
          required: ["questionOrder", "answer", "interviewId"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "end_interview",
        description:
          "Mülakatı sonlandır ve değerlendirme yap. Tüm sorular bittiğinde veya kullanıcı bitirmek istediğinde çağır. answers parametresine tüm soru-cevap çiftlerini ekle.",
        parameters: {
          type: "object",
          properties: {
            overallScore: {
              type: "number",
              description: "Genel performans puanı (0-100)",
            },
            summary: {
              type: "string",
              description: "Kısa değerlendirme özeti",
            },
            interviewId: {
              type: "string",
              description: `Mülakat ID. Her zaman "${interviewId}" olmalı.`,
            },
            answers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string", description: "Sorulan soru" },
                  answer: {
                    type: "string",
                    description: "Kullanıcının verdiği cevap",
                  },
                  order: { type: "number", description: "Soru sırası" },
                },
              },
              description:
                "Tüm soru-cevap çiftleri. Mülakat sırasında sorulan her soru ve alınan cevap.",
            },
          },
          required: ["interviewId", "answers"],
        },
      },
    },
  ];
}
