# AI Coach - Yapay Zeka Destekli Mulakat Hazirligi

AI Coach, yapay zeka destekli mulakat hazirligi icin gelistirilmis bir web uygulamasidir. OpenAI API kullanarak gercek zamanli sesli ve goruntulu mulakat deneyimi sunar.

## Ozellikler

- **AI Sesli Mulakat**: OpenAI TTS ve Web Speech API ile gercek zamanli sesli mulakat
- **AI Goruntulu Mulakat**: Kamera ve mikrofon ile AI mulakatci karsisinda pratik
- **Monaco Editor**: VS Code tabanli profesyonel kod editoru
- **Coklu Dil Destegi**: JavaScript, TypeScript, Python, Java, C++
- **Gercek Zamanli Transkript**: Konusmalarin otomatik yaziya dokulmesi

## Kurulum

### 1. Bagimliliklari Yukleyin

```bash
pnpm install
```

### 2. Environment Degiskenlerini Ayarlayin

`.env.local` dosyasini duzenleyin ve OpenAI API anahtarinizi ekleyin:

```env
# OpenAI API Key - https://platform.openai.com/api-keys adresinden alin
OPENAI_API_KEY=sk-your-api-key-here

# OpenAI Model (varsayilan: gpt-4o)
OPENAI_MODEL=gpt-4o

# OpenAI TTS Voice - alloy, echo, fable, onyx, nova, shimmer
OPENAI_TTS_VOICE=nova
```

### 3. Uygulamayi Baslatin

```bash
pnpm dev
```

Tarayicinizda [http://localhost:3000](http://localhost:3000) adresini acin.

## API Endpoints

| Endpoint | Aciklama |
|----------|----------|
| `POST /api/ai/chat` | AI ile sohbet |
| `POST /api/ai/tts` | Text-to-Speech (metin okuma) |
| `POST /api/ai/stt` | Speech-to-Text (ses tanima) |

## Teknolojiler

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, SCSS Modules
- **State**: Redux Toolkit
- **Editor**: Monaco Editor
- **AI**: OpenAI GPT-4o, Whisper, TTS
- **Speech**: Web Speech API

## Proje Yapisi

```
apps/web/
├── app/
│   ├── api/ai/          # AI API endpoints
│   ├── interview/       # Mulakat sayfalari
│   └── page.tsx         # Ana sayfa
├── src/
│   ├── common/          # Ortak bilesenler
│   ├── features/        # Ozellik bazli moduller
│   └── services/ai/     # AI servis katmani
└── .env.local           # Environment degiskenleri
```

## Tarayici Gereksinimleri

- Chrome (onerilen) - Web Speech API tam destegi
- Firefox - Sinirli Web Speech API destegi
- Safari - Sinirli destek

## Notlar

- Web Speech API sadece Chrome'da tam olarak calisir
- Kamera ve mikrofon izinlerini vermeniz gerekir
- OpenAI API kullanimi ucretlidir

## Lisans

MIT
