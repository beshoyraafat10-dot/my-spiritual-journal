import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";

const Ctx = createContext<{ session: Session | null; ready: boolean }>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return <Ctx.Provider value={{ session, ready }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

export async function signInWithGoogle(intent: "signup" | "signin") {
  localStorage.setItem("khalwety-auth-intent", intent);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: intent === "signin" ? { prompt: "select_account" } : { prompt: "consent select_account" },
    },
  });
  if (error) throw error;
}
