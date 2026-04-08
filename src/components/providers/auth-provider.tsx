"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  dispatchUnauthorizedApiEvent,
  isApiRequest,
  onUnauthorizedApiEvent,
} from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  handleUnauthorized: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  refreshSession: async () => {},
  handleUnauthorized: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const unauthorizedInFlightRef = useRef(false);

  const refreshSession = useCallback(async () => {
    const {
      data: { session: nextSession },
    } = await supabase.auth.getSession();

    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setIsLoading(false);
  }, [supabase]);

  const handleUnauthorized = useCallback(async () => {
    if (unauthorizedInFlightRef.current) return;
    unauthorizedInFlightRef.current = true;

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        router.refresh();
        return;
      }

      toast.error("Your session has expired. Please log in again.");
      router.push("/login?reason=expired");
    } finally {
      window.setTimeout(() => {
        unauthorizedInFlightRef.current = false;
      }, 750);
    }
  }, [router, supabase]);

  useEffect(() => {
    // Hydrate initial session
    void refreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[auth]", event);
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (event === "SIGNED_OUT") {
        router.push("/login?reason=expired");
      }
      if (
        event === "TOKEN_REFRESHED" ||
        event === "SIGNED_IN" ||
        event === "USER_UPDATED"
      ) {
        router.refresh();
      }
    });

    const removeUnauthorizedListener = onUnauthorizedApiEvent(() => {
      void handleUnauthorized();
    });

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      if (response.status === 401 && isApiRequest(input)) {
        dispatchUnauthorizedApiEvent();
      }
      return response;
    };

    return () => {
      subscription.unsubscribe();
      removeUnauthorizedListener();
      window.fetch = originalFetch;
    };
  }, [handleUnauthorized, refreshSession, router, supabase]);

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, refreshSession, handleUnauthorized }}
    >
      {children}
    </AuthContext.Provider>
  );
}
