"use client";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  active: boolean;
  onClick: () => void;
};

export default function ConversationItem({ title, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors",
        active
          ? "bg-white/[0.06] text-neutral-100"
          : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200",
      )}
    >
      {title || "Untitled"}
    </button>
  );
}
