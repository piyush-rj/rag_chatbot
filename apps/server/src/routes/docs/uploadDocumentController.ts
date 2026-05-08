import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import IngestionService from '../../services/pdf/ingestion_services';

export default async function uploadDocumentController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const file = req.file;
    if (!file) {
        ResponseWriter.badRequest(res, 'No file provided');
        return;
    }

    if (file.mimetype !== 'application/pdf') {
        ResponseWriter.badRequest(
            res,
            'Only application/pdf is supported',
            'UNSUPPORTED_MIME',
        );
        return;
    }

    try {
        const result = await IngestionService.ingestPdf(
            file.buffer,
            file.originalname,
            file.mimetype,
            user.id,
        );
        ResponseWriter.created(res, {
            documentId: result.documentId,
            name: file.originalname,
            chunkCount: result.chunkCount,
            status: 'READY',
        });
    } catch (error) {
        console.error('uploadDocument failed', { error });
        ResponseWriter.serverError(res, 'Document processing failed');
    }
}
