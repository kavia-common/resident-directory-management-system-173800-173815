"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser, UserRole } from "@/lib/types";
import {
  apiLogin,
  apiLogout,
  apiMe,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from "@/lib/apiClient";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: AuthUser }
  | { status: "error"; user: null; message: string };

function normalizeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Client-side auth state based on localStorage. */
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setState({ status: "authenticated", user: stored });
    } else {
      setState({ status: "anonymous", user: null });
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setState({ status: "loading", user: null });
      const me = await apiMe();
      setStoredUser(me);
      setState({ status: "authenticated", user: me });
    } catch {
      setStoredUser(null);
      setStoredToken(null);
      setState({ status: "anonymous", user: null });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState({ status: "loading", user: null });
      const { token, user } = await apiLogin(email, password);
      setStoredToken(token);
      setStoredUser(user);
      setState({ status: "authenticated", user });
      return { ok: true as const };
    } catch (e) {
      setStoredToken(null);
      setStoredUser(null);
      setState({ status: "error", user: null, message: normalizeError(e) });
      return { ok: false as const, message: normalizeError(e) };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore; we still clear local state
    } finally {
      setStoredToken(null);
      setStoredUser(null);
      setState({ status: "anonymous", user: null });
    }
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => state.status === "authenticated" && state.user.role === role,
    [state]
  );

  const user = useMemo(() => (state.status === "authenticated" ? state.user : null), [state]);

  return { state, user, login, logout, refresh, hasRole };
}
