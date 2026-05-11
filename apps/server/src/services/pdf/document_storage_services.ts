import { join } from 'node:path';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';

const requiredEnv = (name: string): string => {
    const v = process.env[name];
    if (!v) throw new Error(`${name} is required in environment`);
    return v;
};

const ENDPOINT = requiredEnv('S3_ENDPOINT');
const REGION = requiredEnv('S3_REGION');
const BUCKET = requiredEnv('S3_BUCKET');
const FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';

const s3 = new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    forcePathStyle: FORCE_PATH_STYLE,
    credentials: {
        accessKeyId: requiredEnv('S3_ACCESS_KEY_ID'),
        secretAccessKey: requiredEnv('S3_SECRET_ACCESS_KEY'),
    },
});

// Surface a clean "not found" error to callers so they don't have to know
// about SDK-specific error names (NoSuchKey, NotFound, etc.).
export class StorageFileNotFoundError extends Error {
    constructor(public readonly storageKey: string) {
        super(`File not found in object storage: ${storageKey}`);
        this.name = 'StorageFileNotFoundError';
    }
}

function isNotFoundError(err: unknown): boolean {
    const e = err as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
    };
    return (
        e.name === 'NoSuchKey' ||
        e.name === 'NotFound' ||
        e.$metadata?.httpStatusCode === 404
    );
}

export default class DocumentStorage {
    public static async writePdf(
        userId: string,
        documentId: string,
        bytes: Uint8Array,
    ): Promise<string> {
        const storageKey = DocumentStorage.buildKey(userId, documentId);
        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: storageKey,
                Body: bytes,
                ContentType: 'application/pdf',
            }),
        );
        return storageKey;
    }

    public static async readPdf(storageKey: string): Promise<Buffer> {
        try {
            const result = await s3.send(
                new GetObjectCommand({
                    Bucket: BUCKET,
                    Key: storageKey,
                }),
            );
            if (!result.Body) {
                throw new StorageFileNotFoundError(storageKey);
            }
            const bytes = await result.Body.transformToByteArray();
            return Buffer.from(bytes);
        } catch (err) {
            if (isNotFoundError(err)) {
                throw new StorageFileNotFoundError(storageKey);
            }
            throw err;
        }
    }

    public static async deleteIfExists(storageKey: string): Promise<void> {
        try {
            await s3.send(
                new DeleteObjectCommand({
                    Bucket: BUCKET,
                    Key: storageKey,
                }),
            );
        } catch (err) {
            // DeleteObject is idempotent in S3, so missing keys don't error
            // — but network or auth errors might surface here. Tolerate
            // "not found" anyway for safety.
            if (isNotFoundError(err)) return;
            throw err;
        }
    }

    public static async size(storageKey: string): Promise<number> {
        try {
            const result = await s3.send(
                new HeadObjectCommand({
                    Bucket: BUCKET,
                    Key: storageKey,
                }),
            );
            return result.ContentLength ?? 0;
        } catch (err) {
            if (isNotFoundError(err)) {
                throw new StorageFileNotFoundError(storageKey);
            }
            throw err;
        }
    }

    private static buildKey(userId: string, documentId: string): string {
        return join('users', userId, `${documentId}.pdf`);
    }
}
