'use client';
import { ExternalLink } from 'lucide-react';
import { SourceCitation } from 'shared';

type Props = {
    index: number;
    source: SourceCitation;
};

function getDomain(url: string) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

export default function SourceCard({ index, source }: Props) {
    return (
        <a
            href={source.url}
            target='_blank'
            rel='noopener noreferrer'
            className='shrink-0 w-[200px] p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-colors group'
        >
            <div className='flex items-center justify-between mb-2'>
                <span className='text-xs text-neutral-500 font-mono'>
                    [{index}]
                </span>
                <ExternalLink className='w-3 h-3 text-neutral-600 group-hover:text-neutral-300 transition-colors' />
            </div>
            <p className='text-xs font-medium text-neutral-200 line-clamp-2 leading-snug mb-1.5'>
                {source.title}
            </p>
            <p className='text-[11px] text-neutral-500 truncate'>
                {getDomain(source.url)}
            </p>
        </a>
    );
}
