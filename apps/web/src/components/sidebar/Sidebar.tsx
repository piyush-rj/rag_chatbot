'use client';
import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { useActiveTabRendererStore } from '@/store/useActiveTabRenderer';
import { SECTION_TABS } from '@/types/section_types';
import ConversationItem from './ConversationItem';
import UserMenu from './UserMenu';
import {
    application_name,
    application_description,
    application_logo as ApplicationLogo,
} from '@/lib/application';
import { cn } from '@/lib/utils';
import { FiSidebar } from 'react-icons/fi';
import { IoIosArrowDown } from 'react-icons/io';
import { AnimatePresence, motion } from 'framer-motion';
import SidebarOptions from './SidebarOptions';

export default function Sidebar() {
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token ?? null;
    const [hideHistory, setHideHistory] = useState<boolean>(false);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const conversations = useChatStore((s) => s.conversations);
    const currentId = useChatStore((s) => s.currentConversationId);
    const loadConversations = useChatStore((s) => s.loadConversations);
    const selectConversation = useChatStore((s) => s.selectConversation);
    const newConversation = useChatStore((s) => s.newConversation);
    const setActiveTab = useActiveTabRendererStore((s) => s.setActiveTab);

    useEffect(() => {
        if (token) loadConversations(token);
    }, [token, loadConversations]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === '.') {
                e.preventDefault();
                setIsCollapsed((prev) => !prev);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <aside
            className={cn(
                'shrink-0 flex flex-col select-none overflow-hidden ',
                'transition-[width] ease-out',
                isCollapsed
                    ? 'w-14 duration-200 border-r border-white/6'
                    : 'w-60 border-r border-white/6 duration-200',
            )}
        >
            <div className='px-3 py-4 flex items-center gap-2 w-60 shrink-0'>
                <button
                    onClick={() => {
                        if (isCollapsed) {
                            setIsCollapsed(false);
                        } else {
                            newConversation();
                        }
                    }}
                    className={cn(
                        'group relative h-9 w-9 rounded-[8px] flex justify-center items-center shrink-0 bg-[linear-gradient(145deg,#202020,#181818)] shadow-[inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_2px_rgba(0,0,0,0.6),0_1px_1px_rgba(0,0,0,0.5),0_3px_6px_rgba(0,0,0,0.4),0_6px_12px_rgba(0,0,0,0.25)] cursor-pointer',
                        isCollapsed
                            ? 'cursor-e-resize'
                            : 'cursor-default hover:-rotate-3 transition-all transform duration-250',
                    )}
                >
                    <ApplicationLogo
                        className={cn(
                            'absolute size-5 text-neutral-300 transition-opacity duration-300 filter-[drop-shadow(0_1px_1px_rgba(0,0,0,0.7))_drop-shadow(0_0_1px_rgba(0,0,0,0.5))]',
                            isCollapsed && 'group-hover:opacity-0',
                        )}
                    />
                    <FiSidebar
                        className={cn(
                            'absolute size-4 text-neutral-300 opacity-0 transition-opacity duration-300',
                            isCollapsed && 'group-hover:opacity-100',
                        )}
                    />
                </button>

                <div
                    className={cn(
                        'flex flex-col justify-between min-w-0 whitespace-nowrap transition-opacity duration-200',
                        isCollapsed
                            ? 'opacity-0 pointer-events-none'
                            : 'opacity-100',
                    )}
                >
                    <div className='text-sm'>{application_name}</div>
                    <div className='text-xs text-neutral-600'>
                        {application_description}
                    </div>
                </div>

                <button
                    onClick={() => setIsCollapsed(true)}
                    aria-hidden={isCollapsed}
                    tabIndex={isCollapsed ? -1 : 0}
                    className={cn(
                        'ml-auto cursor-w-resize group bg-transparent border-none p-0 transition-opacity duration-200',
                        isCollapsed
                            ? 'opacity-0 pointer-events-none'
                            : 'opacity-100',
                    )}
                >
                    <FiSidebar className='size-5 text-neutral-400 group-hover:text-neutral-200 transition-colors duration-200' />
                </button>
            </div>

            <SidebarOptions isCollapsed={isCollapsed} />

            <div
                className={cn(
                    'flex flex-col flex-1 min-h-0 w-60 shrink-0 transition-opacity duration-200',
                    isCollapsed
                        ? 'opacity-0 pointer-events-none'
                        : 'opacity-100',
                )}
            >
                <div className='px-3 pt-6 text-neutral-300 text-sm flex items-center gap-1'>
                    <div
                        onClick={() => setHideHistory((prev) => !prev)}
                        className='flex items-center gap-1 cursor-pointer'
                    >
                        Recents
                        <IoIosArrowDown
                            className={cn(
                                'size-3',
                                hideHistory ? 'rotate-180' : '',
                                'transition-all transform duration-300',
                            )}
                        />
                    </div>
                </div>

                <div className='flex-1 overflow-y-auto px-2 py-3 select-none'>
                    <AnimatePresence initial={false}>
                        {!hideHistory && (
                            <motion.div
                                key='recents-list'
                                initial='hidden'
                                animate='visible'
                                exit='hidden'
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.025,
                                            delayChildren: 0.04,
                                        },
                                    },
                                    hidden: {
                                        transition: {
                                            staggerChildren: 0.018,
                                            staggerDirection: -1,
                                        },
                                    },
                                }}
                                className='space-y-0.5'
                            >
                                {conversations.length === 0 ? (
                                    <motion.div
                                        variants={{
                                            hidden: {
                                                opacity: 0,
                                                y: -10,
                                                filter: 'blur(8px)',
                                            },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                filter: 'blur(0px)',
                                            },
                                        }}
                                        transition={{
                                            duration: 0.28,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className='px-3 py-2 text-xs text-neutral-600'
                                    >
                                        No conversations yet
                                    </motion.div>
                                ) : (
                                    conversations.map((c) => (
                                        <motion.div
                                            key={c.id}
                                            variants={{
                                                hidden: {
                                                    opacity: 0,
                                                    y: -12,
                                                    filter: 'blur(8px)',
                                                },
                                                visible: {
                                                    opacity: 1,
                                                    y: 0,
                                                    filter: 'blur(0px)',
                                                },
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                        >
                                            <ConversationItem
                                                id={c.id}
                                                title={c.title}
                                                active={c.id === currentId}
                                                onClick={() => {
                                                    if (!token) return;
                                                    void selectConversation(
                                                        token,
                                                        c.id,
                                                    );
                                                    setActiveTab(
                                                        SECTION_TABS.CHAT_SECTION,
                                                    );
                                                }}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className='px-3 pb-3'>
                <UserMenu isCollapsed={isCollapsed} />
            </div>
        </aside>
    );
}
