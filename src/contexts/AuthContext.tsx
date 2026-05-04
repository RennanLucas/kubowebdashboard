import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const clearLocalProjectState = () => {
  try {
    window.localStorage.removeItem("dashboard:last-project-id");
    window.dispatchEvent(new CustomEvent("project-changed", { detail: { id: undefined } }));
  } catch {
    /* ignore storage errors */
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let restoreFinished = false;

    const handleSessionChange = (nextSession: Session | null) => {
      const nextUserId = nextSession?.user?.id ?? null;
      const prevUserId = previousUserIdRef.current;

      // If the active user changed (login, logout, or account switch),
      // wipe ALL cached queries so data from a previous account never
      // bleeds into the new one. Also clear the persisted project id.
      if (prevUserId !== nextUserId) {
        queryClient.clear();
        if (!nextUserId || (prevUserId && prevUserId !== nextUserId)) {
          clearLocalProjectState();
        }
        previousUserIdRef.current = nextUserId;
      }

      setSession(nextSession);
      setLoading(false);
    };

    const finishRestore = (nextSession: Session | null) => {
      if (!mounted) return;
      restoreFinished = true;
      handleSessionChange(nextSession);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        if (!restoreFinished) restoreFinished = true;
        handleSessionChange(nextSession);
      }
    );

    const timeoutId = window.setTimeout(() => {
      finishRestore(null);
    }, 10000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        window.clearTimeout(timeoutId);
        finishRestore(session);
      })
      .catch(async () => {
        window.clearTimeout(timeoutId);
        void supabase.auth.signOut({ scope: "local" });
        finishRestore(null);
      });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = async () => {
    clearLocalProjectState();
    queryClient.clear();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
