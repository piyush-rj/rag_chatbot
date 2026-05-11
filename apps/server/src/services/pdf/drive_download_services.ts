interface DriveMetadata {
    id: string;
    name: string;
    mimeType?: string;
    owners?: {
        emailAddress: string;
    }[];
}

export default class DriveDownload {
    public static async fetchPDF(
        fileId: string,
        accessToken: string,
    ): Promise<{ bytes: Uint8Array; ownerEmail: string | null }> {
        console.log(
            `[drive] fetching fileId=${fileId} tokenPrefix=${accessToken.slice(0, 12)}...`,
        );

        const metaResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,owners(emailAddress)`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (!metaResponse.ok) {
            const body = await metaResponse.text();
            console.error(
                `[drive] metadata fetch failed status=${metaResponse.status} body=${body}`,
            );
            throw new Error(
                `Drive metadata fetch failed: ${metaResponse.status}`,
            );
        }

        const metaData = (await metaResponse.json()) as DriveMetadata;

        const filesResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (!filesResponse.ok) {
            const body = await filesResponse.text();
            console.error(
                `[drive] file download failed status=${filesResponse.status} body=${body}`,
            );
            throw new Error(
                `Drive file download failed: ${filesResponse.status}`,
            );
        }

        const buffer = new Uint8Array(await filesResponse.arrayBuffer());

        return {
            bytes: buffer,
            ownerEmail: metaData?.owners?.[0]?.emailAddress ?? null,
        };
    }
}
