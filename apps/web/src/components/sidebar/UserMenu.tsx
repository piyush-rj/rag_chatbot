"use client";

import { signIn, signOut } from "next-auth/react";
import { useUserSessionStore } from "@/store/useUserSessionStore";
import { LogIn, LogOut } from "lucide-react";
import Image from "next/image";

export default function UserMenu() {
  const session = useUserSessionStore((s) => s.session);
  const user = session?.user;

  if (!user) {
    return (
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:bg-white/[0.04] transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg group">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name ?? ""}
          className="w-7 h-7 rounded-full ring-1 ring-white/10"
          loading="eager"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-neutral-800 grid place-items-center text-xs text-neutral-300">
          {user.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-neutral-100 truncate">{user.name}</div>
        <div className="text-xs text-neutral-500 truncate">{user.email}</div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign out"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
