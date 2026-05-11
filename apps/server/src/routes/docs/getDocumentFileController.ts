import type { Request, Response } from 'express';
import { prisma } from 'database';
import ResponseWriter from '../../services/responses/response_writer';
import DocumentStorage, {
    StorageFileNotFoundError,
} from '../../services/pdf/document_storage_services';

export default async function getDocumentFileController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const id = req.params.id;
    if (typeof id !== 'string' || id.length === 0) {
        ResponseWriter.badRequest(res, 'Missing document id');
        return;
    }

    try {
        const document = await prisma.document.findFirst({
            where: { id, userId: user.id },
            select: { name: true, mimeType: true, storageKey: true },
        });

        if (!document) {
            console.log(
                `[file] document ${id} not found in DB (or not owned by user ${user.id})`,
            );
            ResponseWriter.notFound(res, 'Document not found');
            return;
        }

        if (!document.storageKey) {
            // Legacy upload: row exists from before file persistence was
            // wired in. The bytes were never saved to disk. Re-upload.
            console.log(
                `[file] document ${id} has no storageKey (legacy upload — predates disk storage)`,
            );
            ResponseWriter.notFound(
                res,
                'This document was uploaded before file storage was enabled. Please delete it and re-upload.',
            );
            return;
        }

        let bytes: Buffer;
        try {
            bytes = await DocumentStorage.readPdf(document.storageKey);
        } catch (err) {
            if (err instanceof StorageFileNotFoundError) {
                console.log(
                    `[file] storageKey "${document.storageKey}" missing in object storage for document ${id}`,
                );
                ResponseWriter.notFound(
                    res,
                    'Stored file is missing. Please re-upload this document.',
                );
                return;
            }
            throw err;
        }

        res.setHeader('Content-Type', document.mimeType);
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${encodeURIComponent(document.name)}"`,
        );
        res.send(bytes);
    } catch (error) {
        console.error('getDocumentFile failed', { error });
        ResponseWriter.serverError(res);
    }
}
