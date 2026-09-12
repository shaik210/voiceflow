-- CreateEnum
CREATE TYPE "TTSStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "tts_audios" (
    "id" TEXT NOT NULL,
    "aiResponseId" TEXT NOT NULL,
    "objectKey" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/wav',
    "size" INTEGER,
    "duration" DOUBLE PRECISION,
    "voice" TEXT NOT NULL DEFAULT 'en_US-lessac-medium',
    "model" TEXT NOT NULL DEFAULT 'piper',
    "status" "TTSStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tts_audios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tts_audios_aiResponseId_key" ON "tts_audios"("aiResponseId");

-- CreateIndex
CREATE INDEX "tts_audios_aiResponseId_idx" ON "tts_audios"("aiResponseId");

-- AddForeignKey
ALTER TABLE "tts_audios" ADD CONSTRAINT "tts_audios_aiResponseId_fkey" FOREIGN KEY ("aiResponseId") REFERENCES "AIResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
