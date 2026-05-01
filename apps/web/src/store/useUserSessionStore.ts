import { Session } from "next-auth";
import { create } from "zustand";

interface UserSessionStoreData {
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const useUserSessionStore = create<UserSessionStoreData>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));
