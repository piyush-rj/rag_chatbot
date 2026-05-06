'use client';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/useChatStore';
import { useActiveTabRendererStore } from '@/store/useActiveTabRenderer';
import { openOverlay } from '@/store/overlays';
import { SECTION_TABS } from '@/types/section_types';
import { Command, Plus, Search, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineChatAlt2 } from 'react-icons/hi';

interface SidebarOptionsProps {
    isCollapsed: boolean;
}

export default function SidebarOptions({ isCollapsed }: SidebarOptionsProps) {
    const newConversation = useChatStore((s) => s.newConversation);
    const { activeTab, setActiveTab } = useActiveTabRendererStore();

    function handleNewChat() {
        newConversation();
        setActiveTab(SECTION_TABS.CHAT_SECTION);
    }

    function handleViewChats() {
        setActiveTab(SECTION_TABS.CHAT_HISTORY);
    }

    function handleSearch() {
        openOverlay('search');
    }

    function handleSettings() {
        openOverlay('settings');
    }

    return (
        <>
            <div className='pt-1 px-3'>
                <button
                    onClick={handleNewChat}
                    className={cn(
                        'h-9 flex items-center rounded-md cursor-pointer overflow-hidden',
                        'bg-linear-to-b from-neutral-900 to-neutral-900/80',
                        'shadow-sm shadow-black/20 inset-shadow-xs inset-shadow-white/3',
                        'text-[13px] text-neutral-300 hover:text-neutral-100',
                        'transition-[width] duration-200 active:scale-[0.98]',
                        isCollapsed ? 'w-9' : 'w-full',
                    )}
                >
                    <span className='w-9 h-9 flex items-center justify-center shrink-0'>
                        <Plus className='w-4 h-4' />
                    </span>
                    <span
                        className={cn(
                            'whitespace-nowrap pr-3 transition-opacity duration-50',
                            isCollapsed ? 'opacity-0' : 'opacity-100',
                        )}
                    >
                        New chat
                    </span>
                </button>
            </div>

            {/* <div className={cn(
                'px-3 pt-6 text-neutral-300 text-sm flex items-center gap-1 transition-opacity duration-200',
                isCollapsed ? 'opacity-0' : 'opacity-100'
                )}>
                Options
            </div> */}

            <div className='pt-2 px-3'>
                <button
                    onClick={handleSearch}
                    className={cn(
                        'h-9 relative flex items-center rounded-md cursor-pointer overflow-hidden',
                        'text-[13px] text-neutral-300 hover:text-neutral-100',
                        'transition-[width] duration-200',
                        isCollapsed ? 'w-9' : 'w-full',
                    )}
                >
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                key='cmd-k-hint'
                                initial={{ opacity: 0, filter: 'blur(6px)' }}
                                animate={{
                                    opacity: 1,
                                    filter: 'blur(0px)',
                                    transition: { duration: 0.02, delay: 0.2 },
                                }}
                                exit={{
                                    opacity: 0,
                                    filter: 'blur(6px)',
                                    transition: { duration: 0.02 },
                                }}
                                className={cn(
                                    'absolute flex items-center',
                                    'gap-x-1 top-1/2 -translate-y-1/2 right-3',
                                    'text-[11px]',
                                    'bg-neutral-800/40 px-1.5 py-px rounded-sm',
                                )}
                            >
                                <Command className='size-2.5' />K
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <span className='w-9 h-9 flex items-center justify-center shrink-0'>
                        <Search className='w-4 h-4' />
                    </span>
                    <span
                        className={cn(
                            'whitespace-nowrap pr-3 transition-opacity duration-50',
                            isCollapsed ? 'opacity-0' : 'opacity-100',
                        )}
                    >
                        Search chat
                    </span>
                </button>
            </div>

            <div className='pt-2 px-3'>
                <button
                    onClick={handleViewChats}
                    className={cn(
                        'h-9 flex items-center rounded-md cursor-pointer overflow-hidden',
                        'text-[13px] text-neutral-300 hover:text-neutral-100',
                        'duration-200',
                        isCollapsed ? 'w-9' : 'w-full',
                        activeTab === SECTION_TABS.CHAT_HISTORY
                            ? 'bg-linear-to-b from-neutral-900 to-neutral-900/80 shadow-sm shadow-black/20 inset-shadow-xs inset-shadow-white/3'
                            : 'bg-transparent',
                    )}
                >
                    <span className='w-9 h-9 flex items-center justify-center shrink-0'>
                        <HiOutlineChatAlt2 className='w-4 h-4' />
                    </span>
                    <span
                        className={cn(
                            'whitespace-nowrap pr-3 transition-opacity duration-50',
                            isCollapsed ? 'opacity-0' : 'opacity-100',
                        )}
                    >
                        View Chats
                    </span>
                </button>
            </div>

            <div className='pt-2 px-3'>
                <button
                    onClick={handleSettings}
                    className={cn(
                        'h-9 flex items-center rounded-md cursor-pointer overflow-hidden',
                        'text-[13px] text-neutral-300 hover:text-neutral-100',
                        'duration-200',
                        isCollapsed ? 'w-9' : 'w-full',
                    )}
                >
                    <span className='w-9 h-9 flex items-center justify-center shrink-0'>
                        <Settings className='w-4 h-4' />
                    </span>
                    <span
                        className={cn(
                            'whitespace-nowrap pr-3 transition-opacity duration-50',
                            isCollapsed ? 'opacity-0' : 'opacity-100',
                        )}
                    >
                        Settings
                    </span>
                </button>
            </div>
        </>
    );
}
