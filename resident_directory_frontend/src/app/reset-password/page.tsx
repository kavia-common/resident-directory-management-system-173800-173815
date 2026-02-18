"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { ApiError, apiResetPassword } from "@/lib/apiClient";

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done" }
  | { kind: "error"; message: string };

function errorToMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const details = typeof err.details === "string" ? err.details : "";
    return `${err.message} (status ${err.status}) ${details}`.trim();
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();

  const initialToken = params.get("token") ?? "";
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<UiState>({ kind: "idle" });

  const subtitle = useMemo(
    () => "Reset password • Token + new password • Single-use & time-limited",
    []
  );

  const passwordsMatch = newPassword.length > 0 && newPassword === confirm;

  return (
    <AppShell title="Resident Directory" subtitle={subtitle}>
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Reset password</div>
          <span className="badge">Token required</span>
        </div>

        <div className="cardBody">
          {!token.trim() && (
            <div className="notice" style={{ marginBottom: 12 }}>
              No token detected. Paste your reset token below (from your email/dev output).
            </div>
          )}

          {state.kind === "error" && (
            <div className="notice noticeError" role="alert" style={{ marginBottom: 12 }}>
              {state.message}
            </div>
          )}

          {state.kind === "done" && (
            <div className="notice noticeSuccess" role="status" style={{ marginBottom: 12 }}>
              Password reset successfully. You can now log in with your new password.
            </div>
          )}

          <div className="fieldRow" style={{ gap: 12 }}>
            <div>
              <div className="label">Reset token</div>
              <input
                className="input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token here…"
                autoComplete="one-time-code"
              />
            </div>

            <div className="fieldRow fieldRow2">
              <div>
                <div className="label">New password</div>
                <input
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  type="password"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <div className="label">Confirm new password</div>
                <input
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {!passwordsMatch && confirm.length > 0 && (
              <div className="notice noticeError" role="alert">
                Passwords do not match.
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btnPrimary"
                disabled={
                  state.kind === "loading" ||
                  !token.trim() ||
                  newPassword.length < 8 ||
                  !passwordsMatch
                }
                onClick={async () => {
                  setState({ kind: "loading" });
                  try {
                    await apiResetPassword({ token: token.trim(), newPassword });
                    setState({ kind: "done" });
                    // Send user to login after a brief moment to read success.
                    setTimeout(() => router.push("/login"), 700);
                  } catch (e) {
                    setState({ kind: "error", message: errorToMessage(e) });
                  }
                }}
              >
                {state.kind === "loading" ? "Resetting…" : "Reset password"}
              </button>

              <Link className="btn" href="/login">
                Back to login
              </Link>

              <Link className="btn" href="/forgot-password">
                Request new token
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams requires a Suspense boundary in Next.js App Router.
  return (
    <Suspense
      fallback={
        <AppShell title="Resident Directory" subtitle="Reset password">
          <section className="card">
            <div className="cardBody">
              <div className="notice" aria-busy="true">
                Loading reset form…
              </div>
            </div>
          </section>
        </AppShell>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
