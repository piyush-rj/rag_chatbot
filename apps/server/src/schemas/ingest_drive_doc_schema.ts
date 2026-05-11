import z from 'zod';

const ingest_drive_doc_schema = z.object({
    fileId: z.string(),
    accessToken: z.string(),
    name: z.string(),
    mimeType: z.string(),
});

export default ingest_drive_doc_schema;
