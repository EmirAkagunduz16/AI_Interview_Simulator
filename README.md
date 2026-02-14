# AI Coach - Mock Interview Platform

AI destekli mülakat hazırlık platformu. Gerçek bir microservice mimarisi ile tasarlanmıştır.

## Mimari

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                         │
│                              Port: 3000                              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway (NestJS)                         │
│                              Port: 3001                              │
│                    Routes requests to microservices                  │
└─────┬─────────┬─────────┬─────────┬─────────┬───────────────────────┘
      │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Auth   │ │  User   │ │Question │ │Interview│ │   AI    │
│ Service │ │ Service │ │ Service │ │ Service │ │ Service │
│  :3002  │ │  :3003  │ │  :3004  │ │  :3005  │ │  :3006  │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │           │
     ▼           ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ auth_db │ │ user_db │ │quest_db │ │inter_db │ │ OpenAI  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
                     MongoDB :27018
```

## Servisler

| Servis | Port | Veritabanı | Açıklama |
|--------|------|------------|----------|
| API Gateway | 3001 | - | Tüm istekleri yönlendirir, rate limiting |
| Auth Service | 3002 | auth_db | JWT authentication, token yönetimi |
| User Service | 3003 | user_db | Kullanıcı profili, abonelik |
| Question Service | 3004 | question_db | Soru bankası yönetimi |
| Interview Service | 3005 | interview_db | Mülakat oturumları |
| AI Service | 3006 | - | OpenAI entegrasyonu (Chat, TTS, STT) |

## Hızlı Başlangıç

### Gereksinimler

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# Docker servislerini başlat (MongoDB, Redis)
docker compose up -d mongodb redis

# Tüm servisleri geliştirme modunda başlat
./scripts/dev.sh services

# Veya tek tek başlat
./scripts/dev.sh gateway   # API Gateway
./scripts/dev.sh auth      # Auth Service
./scripts/dev.sh user      # User Service
./scripts/dev.sh question  # Question Service
./scripts/dev.sh interview # Interview Service
./scripts/dev.sh ai        # AI Service

# Frontend
cd apps/web && pnpm dev
```

### Docker Compose ile Tam Kurulum

```bash
# Tüm servisleri Docker ile başlat
docker compose up -d

# Dev araçları ile (Mongo Express, Redis Commander)
docker compose --profile dev up -d
```

### Environment Variables

Her servisin kendi `.env` dosyası var. Önemli değişkenler:

```bash
# AI Service
OPENAI_API_KEY=your-api-key

# Auth Service
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## API Endpoints

### Auth (`/api/v1/auth`)
- `POST /register` - Yeni kullanıcı kaydı
- `POST /login` - Giriş
- `POST /refresh` - Token yenileme
- `POST /logout` - Çıkış

### Users (`/api/v1/users`)
- `GET /me` - Mevcut kullanıcı profili
- `PATCH /me` - Profil güncelleme

### Questions (`/api/v1/questions`)
- `GET /` - Soruları listele
- `GET /random` - Rastgele sorular
- `GET /categories` - Kategoriler
- `POST /seed` - Örnek sorular ekle

### Interviews (`/api/v1/interviews`)
- `POST /` - Yeni mülakat oluştur
- `GET /` - Mülakatları listele
- `POST /:id/start` - Mülakatı başlat
- `POST /:id/submit` - Cevap gönder
- `POST /:id/complete` - Mülakatı tamamla

### AI (`/api/v1/ai`)
- `POST /chat` - AI sohbet
- `POST /evaluate` - Cevap değerlendirme
- `POST /tts` - Text-to-Speech
- `POST /generate-question` - Soru üretme

## Proje Yapısı

```
AI-Coach/
├── apps/
│   ├── api-gateway/      # API Gateway (NestJS)
│   ├── auth-service/     # Authentication (NestJS + MongoDB)
│   ├── user-service/     # User Management (NestJS + MongoDB)
│   ├── question-service/ # Question Bank (NestJS + MongoDB)
│   ├── interview-service/# Interview Sessions (NestJS + MongoDB)
│   ├── ai-service/       # AI Integration (NestJS + OpenAI)
│   └── web/              # Frontend (Next.js 16)
├── packages/
│   └── shared-types/     # Paylaşılan TypeScript tipleri
├── scripts/
│   └── dev.sh            # Development scripts
└── docker-compose.yml    # Docker orchestration
```

## Teknolojiler

### Backend
- **NestJS** - Node.js framework
- **MongoDB** - Her servis için ayrı veritabanı
- **JWT** - Authentication
- **OpenAI API** - Chat, TTS, STT

### Frontend
- **Next.js 16** - React framework
- **Redux Toolkit** - State management
- **TypeScript** - Type safety
- **SCSS** - Styling

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **pnpm** - Package management (monorepo)

## Geliştirme

```bash
# Tüm servisleri build et
./scripts/dev.sh build

# Veritabanını seed et
./scripts/dev.sh seed

# Docker'ı durdur
./scripts/dev.sh stop
```

## Lisans

MIT
