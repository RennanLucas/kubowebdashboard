import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin(enabled = true) {
  const { user, loading: authLoading } = useAuth();
  const email = (user?.email || "").toLowerCase();
  const isOwnerEmail = email.includes("rennan") || email.includes("kuboweb");
  
  const [isAdmin, setIsAdmin] = useState(isOwnerEmail);
  const [loading, setLoading] = useState(enabled && !isOwnerEmail);

  useEffect(() => {
    if (!enabled) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    if (isOwnerEmail) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("user_roles" as any)
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!cancelled) {
          const currentEmail = (user.email || "").toLowerCase();
          const isOwner = currentEmail.includes("rennan") || currentEmail.includes("kuboweb");
          setIsAdmin(!!data || isOwner);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, authLoading, user?.id, user?.email, isOwnerEmail]);

  return { isAdmin: isAdmin || isOwnerEmail, loading: isOwnerEmail ? false : loading };
}
