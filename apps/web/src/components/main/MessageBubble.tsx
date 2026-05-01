"use client";
import { SourceCitation } from "shared";
import SourceCard from "./SourceCard";

type Props = {
  role: "USER" | "ASSISTANT";
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
  if (role === "USER") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-white/[0.06] text-neutral-100 text-[15px] leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources && sources.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {sources.map((s, i) => (
            <SourceCard key={i} index={i + 1} source={s} />
          ))}
        </div>
      )}
      <div className="text-[15px] leading-relaxed text-neutral-100 whitespace-pre-wrap">
        {content}
        {streaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 bg-neutral-300 animate-pulse" />
        )}
      </div>
    </div>
  );
}
