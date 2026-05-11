'use client';
import { ExternalLink, FileText } from 'lucide-react';
import { SourceCitation } from 'shared';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { documentFileUrl } from '@/routes/api_routes';

type Props = {
    index: number;
    source: SourceCitation;
};

const DOC_URL_PREFIX = 'doc://';

function getDomain(url: string) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

export default function SourceCard({ index, source }: Props) {
    const token = useUserSessionStore((s) => s.session?.user?.token) ?? '';

    const isDocument = source.url.startsWith(DOC_URL_PREFIX);
    const href = isDocument
        ? documentFileUrl(source.url.slice(DOC_URL_PREFIX.length), token)
        : source.url;
    const subtitle = isDocument ? 'PDF document' : getDomain(source.url);
    const pageLabel = source.page ? `p. ${source.page}` : null;

    return (
        <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className='shrink-0 w-[200px] p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-colors group'
        >
            <div className='flex items-center justify-between mb-2'>
                <span className='text-xs text-neutral-500 font-mono'>
                    [{index}]
                </span>
                {isDocument ? (
                    <FileText className='w-3 h-3 text-neutral-600 group-hover:text-neutral-300 transition-colors' />
                ) : (
                    <ExternalLink className='w-3 h-3 text-neutral-600 group-hover:text-neutral-300 transition-colors' />
                )}
            </div>
            <p className='text-xs font-medium text-neutral-200 line-clamp-2 leading-snug mb-1.5'>
                {source.title}
            </p>
            <div className='flex items-center gap-1.5 text-[11px] text-neutral-500'>
                <span className='truncate'>{subtitle}</span>
                {pageLabel && (
                    <>
                        <span className='text-neutral-700'>·</span>
                        <span className='font-mono text-neutral-400 shrink-0'>
                            {pageLabel}
                        </span>
                    </>
                )}
            </div>
        </a>
    );
}
