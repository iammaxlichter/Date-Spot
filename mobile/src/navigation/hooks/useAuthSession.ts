// src/navigation/hooks/useAuthSession.tsx
import React from "react";
import { supabase } from "../../services/supabase/client";

export function useAuthSession() {
  const [session, setSession] = React.useState<any>(null);
  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, booting };
}
