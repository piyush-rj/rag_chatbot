import { prisma, Role } from "database";
import type { SourceCitation } from "shared";

export default class DatabaseServices {
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

  static async saveUserMessage(conversationId: string, content: string) {
    return prisma.message.create({
      data: { conversationId, role: Role.USER, content },
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
          create: sources.map((s) => ({ title: s.title, url: s.url })),
        },
      },
    });
  }

  static async getConversationHistory(conversationId: string, userId: string) {
    return prisma.message.findMany({
      where: {
        conversationId,
        conversation: { userId },
      },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });
  }

  static async listConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });
  }

  static async getConversationDetail(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sources: true },
        },
      },
    });
  }

  static async touchConversation(conversationId: string, userId: string) {
    return prisma.conversation.update({
      where: { id: conversationId, userId },
      data: { updatedAt: new Date() },
    });
  }
}
