import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import { prisma } from 'database';

export default async function getAllDocumentsController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user || !user.id) {
        ResponseWriter.unauthorized(res);
        return;
    }

    try {
        const docs = await prisma.document.findMany({
            where: { userId: user.id },
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
            orderBy: { createdAt: 'desc' },
        });

        ResponseWriter.ok(res, { docs });
    } catch (error) {
        console.error('getAllDocumentsController error: ', error);
        ResponseWriter.serverError(res);
        return;
    }
}
