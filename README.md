# VoiceFlow V1

VoiceFlow is a modern voice-to-text application architecture designed to record user voice, transmit audio to a backend API, transcribe audio to text using AI speech-to-text services, and present real-time transcriptions to users.

This initial V1 setup establishes a production-quality, modular full-stack monorepo foundation.

---

## 1. What VoiceFlow Is
VoiceFlow provides an intuitive interface for speech-to-text transcription. The initial setup focuses on clean architecture, component design, database migrations, and Redis connection layers without premature business logic.

---

## 2. Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Node.js, NestJS, TypeScript, REST API
- **Database:** PostgreSQL, Prisma ORM
- **Infrastructure:** Redis, Docker Compose
- **Package Manager:** pnpm (Monorepo Workspaces)

---

## 3. Project Structure

```text
voiceflow/
├── apps/
│   ├── web/               # Next.js frontend application (App Router)
│   │   └── src/
│   │       ├── app/       # Pages and Layouts
│   │       └── components/# Header, Record Button, Transcription Box
│   │
│   └── api/               # NestJS backend API
│       └── src/
│           ├── main.ts    # Application entrypoint & global prefix
│           ├── app.module.ts
│           ├── health/    # HealthModule, HealthController, HealthService
│           ├── prisma/    # PrismaModule, PrismaService
│           ├── redis/     # RedisModule, RedisService
│           └── common/    # Exception filters & interceptors
│
├── packages/
│   ├── shared/            # Shared TypeScript interfaces & DTOs
│   └── config/            # Shared project configuration
│
├── prisma/
│   └── schema.prisma      # Prisma ORM schema (PostgreSQL)
│
├── docker-compose.yml     # PostgreSQL + Redis containers
├── package.json           # Root package scripts
├── pnpm-workspace.yaml    # Workspace definition
├── tsconfig.json          # Root TypeScript configuration
├── .env.example           # Environment template
├── .gitignore
└── README.md
```

---

## 4. Prerequisites

- **Node.js**: v18+ or v20+ (Tested on v24)
- **pnpm**: v8+ or v9+ (Installed via npm / corepack)
- **Docker & Docker Compose**: For local PostgreSQL and Redis

---

## 5. Installation

Clone or navigate to the repository, then install dependencies:

```bash
cd voiceflow
pnpm install
```

---

## 6. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration variables:

```env
DATABASE_URL="postgresql://voiceflow:voiceflow_secret@localhost:5432/voiceflow_db?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=4000
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

## 7. Starting PostgreSQL + Redis

Start local database and cache services using Docker Compose:

```bash
docker compose up -d
```

Verify service containers are healthy:

```bash
docker compose ps
```

Generate Prisma database client:

```bash
pnpm db:generate
```

---

## 8. Running Frontend and Backend

To launch both the Next.js frontend and Express backend concurrently:

```bash
pnpm dev
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:4000](http://localhost:4000)

---

## 9. Health-Check Endpoint

Verify backend operation:

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "voiceflow-api"
}
```

---

## 10. Planned V1 Development Steps

1. **Step 1 (Current):** Monorepo setup, Express health routes, Next.js UI placeholder components, Prisma PostgreSQL & Redis integration layers.
2. **Step 2:** Web Audio API & MediaRecorder integration in `record-button.tsx` for client-side audio recording.
3. **Step 3:** Multipart audio upload endpoint (`POST /api/transcribe`) in Express backend.
4. **Step 4:** Speech-to-Text service integration (e.g. OpenAI Whisper / Deepgram) and background processing via Redis queue.
5. **Step 5:** Real-time state updates & transcription rendering in the frontend dashboard.
# voiceflow
