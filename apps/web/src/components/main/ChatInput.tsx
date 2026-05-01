"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useUserSessionStore } from "@/store/useUserSessionStore";
import { cn } from "@/lib/utils";

export default function ChatInput() {
  const [value, setValue] = useState("");
  const session = useUserSessionStore((s) => s.session);
  const token = session?.user?.token ?? null;
  const isStreaming = useChatStore((s) => s.isStreaming);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const canSubmit = !!token && !isStreaming && value.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit || !token) return;
    const text = value;
    setValue("");
    await sendMessage(token, text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="px-6 pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="relative rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-white/[0.16] transition-colors">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={token ? "Ask anything…" : "Sign in to start chatting"}
            rows={1}
            disabled={!token}
            className="w-full bg-transparent resize-none px-5 py-4 pr-14 text-[15px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none disabled:opacity-60 max-h-40"
          />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "absolute right-2 bottom-2 w-9 h-9 rounded-xl grid place-items-center transition-colors",
              canSubmit
                ? "bg-neutral-100 text-neutral-900 hover:bg-white"
                : "bg-white/[0.06] text-neutral-600 cursor-not-allowed",
            )}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-neutral-600">
          Riva can make mistakes.
        </p>
      </div>
    </div>
  );
}
