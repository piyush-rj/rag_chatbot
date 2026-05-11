import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import ingest_drive_doc_schema from '../../schemas/ingest_drive_doc_schema';
import { DocumentSource, DocumentStatus, prisma } from 'database';
import DriveDownload from '../../services/pdf/drive_download_services';
import IngestionService from '../../services/pdf/ingestion_services';

export default async function ingestDriveDocumentController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user || !user.id) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const { data, success } = ingest_drive_doc_schema.safeParse(req.body);
    if (!success) {
        ResponseWriter.badRequest(res, 'invalid body');
        return;
    }

    if (data.mimeType !== 'application/pdf') {
        ResponseWriter.badRequest(res, 'mimeType must be of form PDF');
        return;
    }

    try {
        const existingDoc = await prisma.document.findFirst({
            where: {
                userId: user.id,
                driveFileId: data.fileId,
                status: { not: DocumentStatus.FAILED },
            },
            select: { id: true, name: true },
        });
        if (existingDoc) {
            const chunkCount = await prisma.documentChunk.count({
                where: { documentId: existingDoc.id },
            });
            ResponseWriter.ok(res, {
                documentId: existingDoc.id,
                name: existingDoc.name,
                chunkCount,
                reused: true,
            });
            return;
        }

        const { bytes, ownerEmail } = await DriveDownload.fetchPDF(
            data.fileId,
            data.accessToken,
        );
        const { documentId, chunkCount } = await IngestionService.ingestPdf(
            bytes,
            data.name,
            data.mimeType,
            user.id,
            {
                source: DocumentSource.DRIVE,
                driveFileId: data.fileId,
                driveOwner: ownerEmail,
            },
        );
        ResponseWriter.ok(res, {
            documentId,
            name: data.name,
            chunkCount,
            reused: false,
        });
    } catch (error) {
        console.error('ingestDriveDocumentController error: ', error);
        ResponseWriter.serverError(res);
        return;
    }
}
