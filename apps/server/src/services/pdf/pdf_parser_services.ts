import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export type PdfPage = {
    pageNumber: number;
    text: string;
};

export default class PdfParser {
    public static async parse(buffer: Uint8Array): Promise<PdfPage[]> {
        // pdfjs-dist 5.x version rejects node buffers (which extend Uint8Array but are
        // detected via instanceof Buffer). hence rewrap to a plain Uint8Array view.
        const data = new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
        );

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
