-- CreateTable
CREATE TABLE "AIResponse" (
    "id" TEXT NOT NULL,
    "transcriptionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIResponse_transcriptionId_key" ON "AIResponse"("transcriptionId");

-- AddForeignKey
ALTER TABLE "AIResponse" ADD CONSTRAINT "AIResponse_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "transcriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
