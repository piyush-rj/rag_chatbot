import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.middleware';
import uploadSingleMiddleware from '../../middlewares/upload.middleware';
import uploadDocumentController from './uploadDocumentController';
import deleteDocumentController from './deleteDocumentController';
import getDocumentFileController from './getDocumentFileController';
import getAllDocumentsController from './getAllDocumentsController';
import ingestDriveDocumentController from './ingestDriveDocumentController';

const documentRoutes = Router();

documentRoutes.post(
    '/documents/upload',
    authMiddleware,
    uploadSingleMiddleware,
    uploadDocumentController,
);
documentRoutes.get(
    '/documents/:id/file',
    authMiddleware,
    getDocumentFileController,
);
documentRoutes.get('/documents', authMiddleware, getAllDocumentsController);
documentRoutes.delete(
    '/documents/:id',
    authMiddleware,
    deleteDocumentController,
);
documentRoutes.post(
    '/documents/ingest-drive',
    authMiddleware,
    ingestDriveDocumentController,
);

export default documentRoutes;
