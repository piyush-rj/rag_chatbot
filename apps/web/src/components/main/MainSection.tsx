"use client";

import { useChatStore } from "@/store/useChatStore";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";

export default function MainSection() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const showEmpty = messages.length === 0 && !isStreaming;

  return (
    <main className="flex-1 flex flex-col min-w-0">
      <div className="flex-1 overflow-y-auto">
        {showEmpty ? <EmptyState /> : <MessageList />}
      </div>
      <ChatInput />
    </main>
  );
}
