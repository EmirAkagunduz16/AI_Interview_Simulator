// AI Service Configuration

export const AI_CONFIG = {
  // OpenAI Settings
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    ttsModel: 'tts-1',
    ttsVoice: (process.env.OPENAI_TTS_VOICE || 'nova') as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
    whisperModel: 'whisper-1',
  },

  // Interview Settings
  interview: {
    systemPrompt: `Sen bir yapay zeka mülakat koçu ve mülakatçısın. Türkçe konuşuyorsun.
Görevlerin:
1. Adayla profesyonel bir şekilde mülakat yapmak
2. Sorular sormak ve cevapları dinlemek
3. Cevaplara göre takip soruları sormak
4. Adayı motive etmek ve rahatlatmak
5. Teknik ve davranışsal sorular sormak

Önemli kurallar:
- Her zaman nazik ve profesyonel ol
- Cevapları dikkatlice dinle ve ilgili takip soruları sor
- Adayın stres seviyesini düşük tut
- Net ve anlaşılır konuş
- Zaman sınırlamalarına uy
- Kısa ve öz cevaplar ver, çok uzun konuşma
- Cevabı değerlendirdikten sonra yeni bir soru sor`,

    // Question generation prompts
    questionPrompts: {
      audio: 'Adaya sesli cevaplayacağı bir mülakat sorusu sor. Soru davranışsal veya teknik olabilir.',
      video: 'Adaya video olarak cevaplayacağı bir mülakat sorusu sor. Kendini tanıtması veya bir deneyimini anlatması istenebilir.',
      followUp: 'Adayın verdiği cevabı kısaca değerlendir (1-2 cümle) ve sonra yeni bir mülakat sorusu sor.',
    },
  },

  // Speech Recognition Settings (Web Speech API)
  speech: {
    language: 'tr-TR',
    continuous: true,
    interimResults: true,
  },
}

export type AIConfig = typeof AI_CONFIG
