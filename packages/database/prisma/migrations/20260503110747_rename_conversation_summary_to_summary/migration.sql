/*
  Warnings:

  - You are about to drop the column `conversationSummary` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "conversationSummary",
ADD COLUMN     "summary" TEXT;
