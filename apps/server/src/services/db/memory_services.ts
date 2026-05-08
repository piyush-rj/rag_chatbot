import { prisma } from 'database';

export default class MemoryService {
    static async getUserMemories(
        userId: string,
        limit: number = 30,
    ): Promise<string[]> {
        const memories = await prisma.userMemory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { fact: true },
        });
        return memories.map((m) => m.fact);
    }

    static async addUserMemories(
        userId: string,
        facts: string[],
        sourceConversationId: string,
    ) {
        if (facts.length === 0) return;
        return prisma.userMemory.createMany({
            data: facts.map((fact) => ({
                userId,
                fact,
                source: sourceConversationId,
            })),
        });
    }

    static async listUserMemories(userId: string) {
        return prisma.userMemory.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                fact: true,
                source: true,
                createdAt: true,
            },
        });
    }

    static async deleteUserMemory(userId: string, memoryId: string) {
        return prisma.userMemory.deleteMany({
            where: { id: memoryId, userId },
        });
    }
}
