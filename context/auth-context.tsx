"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface LocalSession {
  email: string;
  name?: string;
  provider?: "email" | "google";
}

interface AuthContextValue {
  hydrated: boolean;
  session: Session | LocalSession | null;
  supabaseEnabled: boolean;
  signIn: (session: LocalSession) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const LOCAL_SESSION_KEY = "prediscore.localSession";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseEnabled = isSupabaseConfigured();
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | LocalSession | null>(null);

  useEffect(() => {
    let alive = true;
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      try {
        const raw = window.localStorage.getItem(LOCAL_SESSION_KEY);
        if (raw && alive) setSession(JSON.parse(raw) as LocalSession);
      } catch {
        /* localStorage indisponible */
      }
      if (alive) setHydrated(true);
      return () => {
        alive = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setHydrated(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      setSession(nextSession);
      setHydrated(true);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      session,
      supabaseEnabled,
      signIn(next) {
        if (supabaseEnabled) return;
        window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(next));
        setSession(next);
      },
      async signOut() {
        const supabase = getSupabaseBrowserClient();
        if (supabase) await supabase.auth.signOut();
        window.localStorage.removeItem(LOCAL_SESSION_KEY);
        setSession(null);
      },
    }),
    [hydrated, session, supabaseEnabled],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
