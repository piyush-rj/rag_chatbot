-- CreateTable
CREATE TABLE "ConversationDocument" (
    "conversationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationDocument_pkey" PRIMARY KEY ("conversationId","documentId")
);

-- CreateIndex
CREATE INDEX "ConversationDocument_conversationId_idx" ON "ConversationDocument"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationDocument_documentId_idx" ON "ConversationDocument"("documentId");

-- AddForeignKey
ALTER TABLE "ConversationDocument" ADD CONSTRAINT "ConversationDocument_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationDocument" ADD CONSTRAINT "ConversationDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
