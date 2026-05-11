import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import { prisma } from 'database';
import DocumentStorage from '../../services/pdf/document_storage_services';

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
        const document = await prisma.document.findFirst({
            where: { id, userId: user.id },
            select: { id: true, storageKey: true },
        });

        if (!document) {
            ResponseWriter.notFound(res, 'Document not found');
            return;
        }

        await prisma.document.delete({ where: { id: document.id } });
        if (document.storageKey) {
            await DocumentStorage.deleteIfExists(document.storageKey);
        }

        ResponseWriter.ok(res, { documentId: id });
    } catch (error) {
        console.error('deleteDocument failed', { error });
        ResponseWriter.serverError(res);
    }
}
