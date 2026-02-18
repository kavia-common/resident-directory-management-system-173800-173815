"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { ApiError, makeDevUser, setStoredToken, setStoredUser } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [mode, setMode] = useState<"admin" | "resident">("admin");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const subtitle = useMemo(
    () => "Login (Admin or Resident). Retro theme • Mobile responsive.",
    []
  );

  return (
    <AppShell title="Resident Directory" subtitle={subtitle}>
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Login</div>
          <span className="badge">Secure auth via backend (or dev fallback)</span>
        </div>

        <div className="cardBody">
          {status.kind === "error" && (
            <div className="notice noticeError" role="alert">
              {status.message}
            </div>
          )}

          <div className="fieldRow fieldRow2" style={{ marginTop: 12 }}>
            <div>
              <div className="label">Email</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@building.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="label">Password</div>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="label">Quick role (dev fallback only)</div>
            <select
              className="select"
              value={mode}
              onChange={(e) => setMode(e.target.value as "admin" | "resident")}
            >
              <option value="admin">Admin</option>
              <option value="resident">Resident</option>
            </select>
          </div>
        </div>

        <div className="cardFooter">
          <button
            className="btn btnPrimary"
            disabled={status.kind === "loading" || !email || !password}
            onClick={async () => {
              setStatus({ kind: "loading" });
              try {
                const res = await login(email, password);
                if (res.ok) {
                  router.push("/");
                  return;
                }
                setStatus({ kind: "error", message: res.message ?? "Login failed" });
              } catch (e) {
                // If backend isn't implemented yet, allow local dev login
                if (isNotFound(e)) {
                  setStoredToken("dev-token");
                  setStoredUser(makeDevUser(mode, email));
                  router.push("/");
                  return;
                }
                setStatus({
                  kind: "error",
                  message:
                    e instanceof Error
                      ? e.message
                      : "Login failed due to an unknown error.",
                });
              }
            }}
          >
            {status.kind === "loading" ? "Signing in…" : "Sign in"}
          </button>

          <Link className="btn" href="/forgot-password">
            Forgot password
          </Link>

          <button
            className="btn"
            onClick={() => {
              // Explicit dev bypass for demos without backend
              setStoredToken("dev-token");
              setStoredUser(makeDevUser(mode, email));
              router.push("/");
            }}
          >
            Dev bypass
          </button>
        </div>
      </section>
    </AppShell>
  );
}
