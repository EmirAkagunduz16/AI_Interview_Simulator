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
          "Her sorunun tartışması bittikten sonra MUTLAKA çağır. Çağırmadan sonraki soruya geçme. Çağırırken konuşma.",
        parameters: {
          type: "object",
          properties: {
            questionOrder: {
              type: "number",
              description: "Sorunun sıra numarası (1-5)",
            },
            questionId: {
              type: "string",
              description:
                "save_preferences'tan dönen sorunun id değeri",
            },
            questionText: {
              type: "string",
              description: "Sorulan sorunun tam metni",
            },
            answer: {
              type: "string",
              description:
                "Kullanıcının verdiği cevabın detaylı özeti. Kısaltma yapma, kullanıcının ne söylediğini olduğu gibi yaz.",
            },
            interviewId: {
              type: "string",
              description: `Mülakat ID. Her zaman "${interviewId}" olmalı.`,
            },
          },
          required: [
            "questionOrder",
            "questionText",
            "answer",
            "interviewId",
          ],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "end_interview",
        description:
          "Mülakatı sonlandır ve değerlendirmeyi başlat. Tüm 5 soru bittiğinde çağır. Cevaplar zaten save_answer ile kaydedildi, tekrar gönderme.",
        parameters: {
          type: "object",
          properties: {
            interviewId: {
              type: "string",
              description: `Mülakat ID. Her zaman "${interviewId}" olmalı.`,
            },
          },
          required: ["interviewId"],
        },
      },
    },
  ];
}
