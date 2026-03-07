export function buildVapiTools(interviewId: string) {
  return [
    {
      type: "function" as const,
      function: {
        name: "save_preferences",
        description:
          "Mülakatı başlat ve soruları hazırla. Kullanıcı hazır olduğunu belirttiğinde çağır. Çağırırken konuşma.",
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
          "Kullanıcının cevabını kaydet. SADECE cevap değerlendirmesi ve takip soruları dahil tüm tartışma tamamen bittikten sonra çağır. Değerlendirme bitmeden çağırma. Çağırırken konuşma.",
        parameters: {
          type: "object",
          properties: {
            questionOrder: {
              type: "number",
              description: "Sorunun sıra numarası (1-5)",
            },
            questionText: {
              type: "string",
              description: "Sorulan sorunun tam metni",
            },
            answer: {
              type: "string",
              description:
                "Kullanıcının verdiği cevabın tam metni. Kısaltma veya özetleme.",
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
              description: "save_preferences'tan dönen soru listesinin tamamı",
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
          "Mülakatı sonlandır. Tüm sorular bittiğinde çağır. answers parametresine mülakat boyunca sorulan tüm soru-cevap çiftlerini ekle.",
        parameters: {
          type: "object",
          properties: {
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
                "Tüm soru-cevap çiftleri.",
            },
          },
          required: ["interviewId", "answers"],
        },
      },
    },
  ];
}
