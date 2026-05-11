import { prisma, Role } from 'database';
import type { SourceCitation } from 'shared';

export default class ConversationService {
    static async getOrCreateConversation(
        conversationId: string | undefined,
        firstMessage: string,
        userId: string,
    ) {
        if (conversationId) {
            const existing = await prisma.conversation.findFirst({
                where: { id: conversationId, userId },
            });
            if (existing) return existing;
        }

        return prisma.conversation.create({
            data: {
                title: firstMessage.slice(0, 60),
                userId,
            },
        });
    }

    static async saveUserMessage(
        conversationId: string,
        content: string,
        attachmentDocumentIds: string[] = [],
    ) {
        if (attachmentDocumentIds.length === 0) {
            return prisma.message.create({
                data: { conversationId, role: Role.USER, content },
            });
        }

        // Only stamp the bubble with docs that haven't already appeared on an
        // earlier user message in this conversation. The doc is still in the
        // conversation join table and still in scope for retrieval — we just
        // don't want to repeat the chip on every follow-up message.
        const previouslyAttached = await prisma.messageAttachment.findMany({
            where: {
                message: { conversationId },
                documentId: { in: attachmentDocumentIds },
            },
            select: { documentId: true },
        });
        const seenIds = new Set(
            previouslyAttached
                .map((a) => a.documentId)
                .filter((id): id is string => id !== null),
        );
        const newIds = attachmentDocumentIds.filter((id) => !seenIds.has(id));

        if (newIds.length === 0) {
            return prisma.message.create({
                data: { conversationId, role: Role.USER, content },
            });
        }

        // Look up names so the snapshot keeps showing the right label even if
        // the document is later deleted.
        const docs = await prisma.document.findMany({
            where: { id: { in: newIds } },
            select: { id: true, name: true },
        });

        return prisma.message.create({
            data: {
                conversationId,
                role: Role.USER,
                content,
                attachments: {
                    create: docs.map((d) => ({
                        documentId: d.id,
                        documentName: d.name,
                    })),
                },
            },
        });
    }

    static async saveAssistantMessage(
        conversationId: string,
        content: string,
        sources: SourceCitation[],
    ) {
        return prisma.message.create({
            data: {
                conversationId,
                role: Role.ASSISTANT,
                content,
                sources: {
                    create: sources.map((s) => ({
                        title: s.title,
                        url: s.url,
                        page: s.page ?? null,
                    })),
                },
            },
        });
    }

    static async getConversationHistory(
        conversationId: string,
        userId: string,
    ) {
        return prisma.message.findMany({
            where: {
                conversationId,
                conversation: { userId },
            },
            orderBy: { createdAt: 'asc' },
            select: { role: true, content: true },
        });
    }

    static async listConversations(
        userId: string,
        limit?: number,
        offset?: number,
    ) {
        if (limit === undefined) {
            const conversations = await prisma.conversation.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
                select: { id: true, title: true, updatedAt: true },
            });
            return { conversations, hasMore: false };
        }

        const skip = offset ?? 0;
        const [conversations, total] = await Promise.all([
            prisma.conversation.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
                select: { id: true, title: true, updatedAt: true },
                skip,
                take: limit,
            }),
            prisma.conversation.count({ where: { userId } }),
        ]);
        return {
            conversations,
            hasMore: skip + conversations.length < total,
        };
    }

    static async getConversationDetail(conversationId: string, userId: string) {
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sources: true,
                        attachments: {
                            orderBy: { createdAt: 'asc' },
                            select: {
                                id: true,
                                documentId: true,
                                documentName: true,
                            },
                        },
                    },
                },
                documents: {
                    orderBy: { createdAt: 'asc' },
                    include: {
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
                },
            },
        });
        if (!conversation) return null;

        const { documents, ...rest } = conversation;
        return {
            ...rest,
            attachedDocuments: documents.map((d) => d.document),
        };
    }

    static async touchConversation(conversationId: string, userId: string) {
        return prisma.conversation.update({
            where: { id: conversationId, userId },
            data: { updatedAt: new Date() },
        });
    }

    static async updateConversationTitle(
        conversationId: string,
        title: string,
    ) {
        return prisma.conversation.update({
            where: { id: conversationId },
            data: { title },
        });
    }

    static async updateConversationSummary(
        conversationId: string,
        summary: string,
    ) {
        return prisma.conversation.update({
            where: { id: conversationId },
            data: { summary },
        });
    }
}
