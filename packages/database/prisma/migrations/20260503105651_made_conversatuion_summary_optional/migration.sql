-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "conversationSummary" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserMemory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserMemory_pkey" PRIMARY KEY ("id")
);
