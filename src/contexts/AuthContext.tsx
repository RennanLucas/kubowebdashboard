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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!authReadyRef.current && event === "INITIAL_SESSION") return;
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!session) {
          setSession(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          await supabase.auth.signOut({ scope: "local" });
          setSession(null);
        } else {
          setSession(session);
        }
        authReadyRef.current = true;
        setLoading(false);
      })
      .catch(async () => {
        await supabase.auth.signOut({ scope: "local" });
        setSession(null);
        authReadyRef.current = true;
        setLoading(false);
      });

    return () => subscription.unsubscribe();
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
