/*
  Warnings:

  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "recordings_userId_idx" ON "recordings"("userId");

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
