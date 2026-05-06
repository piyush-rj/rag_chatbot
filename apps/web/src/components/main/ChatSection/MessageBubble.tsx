'use client';
import { SourceCitation } from 'shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SourceCard from './SourceCard';
import CodeBlock from './CodeBlock';

type Props = {
    role: 'USER' | 'ASSISTANT';
    content: string;
    sources?: SourceCitation[];
    streaming?: boolean;
};

export default function MessageBubble({
    role,
    content,
    sources,
    streaming,
}: Props) {
    if (role === 'USER') {
        return (
            <div className='flex justify-end'>
                <div className='max-w-[80%] px-4 py-2.5 rounded-2xl bg-cyan-600/40 text-white text-[15px] leading-relaxed whitespace-pre-wrap'>
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
