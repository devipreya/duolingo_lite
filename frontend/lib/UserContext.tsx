"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { get } from "./api";
import type { User } from "./types";

type Ctx = { user: User | null; setUser: (u: User) => void; refresh: () => Promise<void>; offline: boolean };
const C = createContext<Ctx>({ user: null, setUser: () => {}, refresh: async () => {}, offline: false });
export const useUser = () => useContext(C);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [offline, setOffline] = useState(false);
  const refresh = useCallback(async () => {
    try { setUser(await get<User>("/api/me")); setOffline(false); } catch { setOffline(true); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <C.Provider value={{ user, setUser, refresh, offline }}>{children}</C.Provider>;
}
