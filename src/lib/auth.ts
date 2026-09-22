import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearScopedStorage, setStorageUser } from "@/lib/scoped-storage";

/** Signed-in account for the personal academic workspace. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESHED") return;
      setStorageUser(next?.user?.id ?? null);
      setSession(next);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data: current }) => {
      setStorageUser(current.session?.user?.id ?? null);
      setSession(current.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { ready, session, user: session?.user ?? null };
}

export async function signOut() {
  clearScopedStorage();
  await supabase.auth.signOut();
}
