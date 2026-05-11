'use client';
import { FileText } from 'lucide-react';
import { SourceCitation } from 'shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SourceCard from './SourceCard';
import CodeBlock from './CodeBlock';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { documentFileUrl } from '@/routes/api_routes';
import type { UIAttachment } from '@/store/useChatStore';

type Props = {
    role: 'USER' | 'ASSISTANT';
    content: string;
    sources?: SourceCitation[];
    attachments?: UIAttachment[];
    streaming?: boolean;
};

function UserAttachmentChip({ attachment }: { attachment: UIAttachment }) {
    const token = useUserSessionStore((s) => s.session?.user?.token) ?? '';
    const href =
        attachment.documentId && token
            ? documentFileUrl(attachment.documentId, token)
            : null;

    const inner = (
        <>
            <FileText className='size-3.5 text-sky-300 shrink-0' />
            <span className='truncate max-w-48'>{attachment.documentName}</span>
        </>
    );

    const baseClass =
        'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full ring-1 text-xs';

    if (!href) {
        // Document was deleted (documentId set to null by the DB cascade) or
        // we don't have a session token yet. Show a clearly disabled chip
        // so the user knows why clicking isn't doing anything.
        return (
            <span
                title={
                    attachment.documentId
                        ? 'Sign in required to open this document'
                        : 'This document is no longer available'
                }
                className={
                    baseClass +
                    ' bg-cyan-900/20 ring-cyan-300/8 text-cyan-50/50 cursor-not-allowed'
                }
            >
                {inner}
            </span>
        );
    }

    // Use an explicit click handler instead of relying on <a target="_blank">.
    // Same visible result, but we control the behaviour: no chance of the
    // navigation being silently swallowed by anything upstream.
    function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
        e.preventDefault();
        window.open(href!, '_blank', 'noopener,noreferrer');
    }

    return (
        <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            onClick={handleClick}
            className={
                baseClass +
                ' bg-cyan-900/40 ring-cyan-300/15 text-cyan-50 hover:bg-cyan-900/60 transition-colors cursor-pointer'
            }
        >
            {inner}
        </a>
    );
}

export default function MessageBubble({
    role,
    content,
    sources,
    attachments,
    streaming,
}: Props) {
    if (role === 'USER') {
        const hasAttachments = (attachments?.length ?? 0) > 0;
        return (
            <div className='flex flex-col items-end gap-1.5'>
                {hasAttachments && (
                    <div className='flex flex-wrap gap-1.5 justify-end max-w-[80%]'>
                        {attachments!.map((a) => (
                            <UserAttachmentChip key={a.id} attachment={a} />
                        ))}
                    </div>
                )}
                <div className='max-w-[80%] px-4 py-2.5 rounded-2xl bg-cyan-700 text-white text-[15px] leading-relaxed whitespace-pre-wrap'>
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-3'>
            {sources && sources.length > 0 && (
                <div className='flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin'>
                    {sources.map((s, i) => (
                        <SourceCard key={i} index={i + 1} source={s} />
                    ))}
                </div>
            )}
            <div
                className='
                    prose prose-invert prose-sm max-w-none
                    text-[15px] leading-relaxed text-neutral-100
                    prose-p:my-2 prose-p:text-neutral-100
                    prose-headings:text-neutral-100 prose-headings:font-semibold
                    prose-strong:text-neutral-50 prose-strong:font-semibold
                    prose-em:text-neutral-200
                    prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:text-neutral-100
                    prose-code:text-rose-300 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none
                    prose-blockquote:border-l-2 prose-blockquote:border-neutral-700 prose-blockquote:text-neutral-300 prose-blockquote:not-italic
                    prose-hr:border-white/10
                    prose-table:my-3 prose-th:text-neutral-100 prose-td:text-neutral-200
                '
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        pre: ({ children }) => <>{children}</>,
                        code: ({ className, children, ...rest }) => {
                            const match = /language-(\w+)/.exec(
                                className || '',
                            );
                            const text = String(children).replace(/\n$/, '');
                            const isBlock = !!match || text.includes('\n');

                            if (isBlock) {
                                return (
                                    <CodeBlock language={match?.[1] ?? 'text'}>
                                        {text}
                                    </CodeBlock>
                                );
                            }

                            return (
                                <code className={className} {...rest}>
                                    {children}
                                </code>
                            );
                        },
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
            {streaming && (
                <span className='inline-block w-1.5 h-4 bg-neutral-300 animate-pulse' />
            )}
        </div>
    );
}
