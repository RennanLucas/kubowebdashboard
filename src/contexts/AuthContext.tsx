import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  const authReadyRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const finishAuthRestore = (nextSession: Session | null) => {
      if (!mounted || authReadyRef.current) return;
      authReadyRef.current = true;
      setSession(nextSession);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!authReadyRef.current && event === "INITIAL_SESSION") return;
        setSession(session);
        setLoading(false);
      }
    );

    const timeoutId = window.setTimeout(() => {
      finishAuthRestore(null);
    }, 5000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!session) {
          finishAuthRestore(null);
          return;
        }

        finishAuthRestore(session);
      })
      .catch(async () => {
        void supabase.auth.signOut({ scope: "local" });
        finishAuthRestore(null);
      });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
