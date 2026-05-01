"use client";

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 h-full w-full">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-medium tracking-tight text-neutral-100 mb-2">
          What can I help you find?
        </h1>
        <p className="text-sm text-neutral-500">
          Ask anything. I&apos;ll search the web and answer with sources.
        </p>
      </div>
    </div>
  );
}
