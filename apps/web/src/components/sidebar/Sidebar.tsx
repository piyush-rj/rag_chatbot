"use client";

import { useEffect } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useUserSessionStore } from "@/store/useUserSessionStore";
import ConversationItem from "./ConversationItem";
import UserMenu from "./UserMenu";

export default function Sidebar() {
  const session = useUserSessionStore((s) => s.session);
  const token = session?.user?.token ?? null;

  const conversations = useChatStore((s) => s.conversations);
  const currentId = useChatStore((s) => s.currentConversationId);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const newConversation = useChatStore((s) => s.newConversation);

  useEffect(() => {
    if (token) loadConversations(token);
  }, [token, loadConversations]);

  return (
    <aside className="w-[260px] shrink-0 border-r border-white/[0.06] flex flex-col">
      <div className="px-4 py-4 flex items-center gap-2 border-b border-white/[0.06]">
        <Sparkles className="w-4 h-4 text-neutral-300" />
        <span className="text-sm font-medium tracking-tight text-neutral-100">
          Riva
        </span>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={newConversation}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-200 bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {conversations.length === 0 ? (
          <div className="px-3 py-2 text-xs text-neutral-600">
            No conversations yet
          </div>
        ) : (
          conversations.map((c) => (
            <ConversationItem
              key={c.id}
              title={c.title}
              active={c.id === currentId}
              onClick={() => token && selectConversation(token, c.id)}
            />
          ))
        )}
      </div>

      <div className="border-t border-white/[0.06] p-2">
        <UserMenu />
      </div>
    </aside>
  );
}
