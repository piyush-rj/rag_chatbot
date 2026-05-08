import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import { prisma } from 'database';

export default async function deleteDocumentController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
        ResponseWriter.badRequest(res, 'Missing document id');
        return;
    }

    try {
        const { count } = await prisma.document.deleteMany({
            where: { id, userId: user.id },
        });

        if (count === 0) {
            ResponseWriter.notFound(res, 'Document not found');
            return;
        }

        ResponseWriter.ok(res, { documentId: id });
    } catch (error) {
        console.error('deleteDocument failed', { error });
        ResponseWriter.serverError(res);
    }
}
