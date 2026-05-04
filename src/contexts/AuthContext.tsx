import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let restoreFinished = false;

    const finishRestore = (nextSession: Session | null) => {
      if (!mounted) return;
      restoreFinished = true;
      setSession(nextSession);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        if (!restoreFinished) restoreFinished = true;
        setSession(nextSession);
        setLoading(false);
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
  }, []);

  const signOut = async () => {
    try {
      window.localStorage.removeItem("dashboard:last-project-id");
      window.dispatchEvent(new CustomEvent("project-changed", { detail: { id: undefined } }));
    } catch {
      /* ignore storage errors */
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
