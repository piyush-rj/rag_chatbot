import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import { prisma } from 'database';

export default async function listDocumentsController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    try {
        const documents = await prisma.document.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                source: true,
                mimeType: true,
                status: true,
                byteSize: true,
                errorMessage: true,
                createdAt: true,
            },
        });
        ResponseWriter.ok(res, { documents });
    } catch (error) {
        console.error('listDocuments failed', { error });
        ResponseWriter.serverError(res);
    }
}
