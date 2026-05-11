import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export type PdfPage = {
    pageNumber: number;
    text: string;
};

export default class PdfParser {
    public static async parse(buffer: Uint8Array): Promise<PdfPage[]> {
        // work on a copy of the bytes, not a view. pdfjs-dist 5.x transfers
        // ownership of the underlying ArrayBuffer for performance, which
        // leaves the caller's `buffer` detached and unreadable afterwards
        // (an issue we only hit once the bytes also need to be PUT to S3).

        // Note: `buffer.slice()` is NOT safe here because multer hands us a
        // Node Buffer (Buffer extends Uint8Array but overrides slice to
        // return a view that shares the same ArrayBuffer). Explicit
        // allocate + set guarantees a real copy regardless of subclass.
        const data = new Uint8Array(buffer.byteLength);
        data.set(buffer);

        const pdf = await getDocument({
            data,
            useSystemFonts: true,
            disableFontFace: true,
            verbosity: 0,
        }).promise;

        const pages: PdfPage[] = [];

        try {
            for (let n = 1; n <= pdf.numPages; n++) {
                const page = await pdf.getPage(n);
                try {
                    const content = await page.getTextContent();
                    // content.items = [
                    //     { str: 'Piyush raj', hasEOL: false },
                    //     { str: 'portfolio', hasEOL: true },
                    // ]

                    const text = content.items
                        .filter((i): i is TextItem => 'str' in i) // avoid non-text items, like tables, sections, etc
                        .map((i) => (i.hasEOL ? i.str + '\n' : i.str + ' ')) // -> [ "Piyush raj", "portfolio", ... ]
                        .join('') // "Piyush raj portfolio"
                        .replace(/[ \t]+/g, ' ') // remove empty spaces
                        .replace(/\n[ \t]+/g, '\n')
                        .trim();

                    pages.push({ pageNumber: n, text });
                } finally {
                    page.cleanup();
                }
            }
        } finally {
            await pdf.cleanup();
            await pdf.destroy();
        }

        return pages;
        // [
        //     { pageNumber: 1, text: "Piyush raj portfolio"},
        //     { pageNumber: 2, text: "summary of resume" }
        // ]
    }
}
