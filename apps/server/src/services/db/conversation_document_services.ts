import { prisma } from 'database';

export type AttachedDocumentRow = {
    id: string;
    name: string;
    status: string;
    source: string;
    mimeType: string;
};

export default class ConversationDocumentService {
    static async attach(
        conversationId: string,
        userId: string,
        documentIds: string[],
    ): Promise<AttachedDocumentRow[]> {
        if (documentIds.length === 0) return [];

        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            select: { id: true },
        });
        if (!conversation) return [];

        // only attach docs the user owns
        const ownedDocs = await prisma.document.findMany({
            where: { id: { in: documentIds }, userId },
            select: { id: true },
        });
        if (ownedDocs.length === 0) return [];

        await prisma.conversationDocument.createMany({
            data: ownedDocs.map((d) => ({
                conversationId,
                documentId: d.id,
            })),
            skipDuplicates: true,
        });

        return ConversationDocumentService.list(conversationId, userId);
    }

    static async detach(
        conversationId: string,
        userId: string,
        documentId: string,
    ): Promise<boolean> {
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            select: { id: true },
        });
        if (!conversation) return false;

        const { count } = await prisma.conversationDocument.deleteMany({
            where: { conversationId, documentId },
        });
        return count > 0;
    }

    static async list(
        conversationId: string,
        userId: string,
    ): Promise<AttachedDocumentRow[]> {
        const rows = await prisma.conversationDocument.findMany({
            where: {
                conversationId,
                conversation: { userId },
            },
            orderBy: { createdAt: 'asc' },
            select: {
                document: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        source: true,
                        mimeType: true,
                    },
                },
            },
        });
        return rows.map((r) => r.document);
    }

    static async listIds(
        conversationId: string,
        userId: string,
    ): Promise<string[]> {
        const rows = await prisma.conversationDocument.findMany({
            where: {
                conversationId,
                conversation: { userId },
            },
            select: { documentId: true },
        });
        return rows.map((r) => r.documentId);
    }
}
