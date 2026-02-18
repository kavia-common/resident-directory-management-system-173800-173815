"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { ApiError, apiForgotPassword } from "@/lib/apiClient";

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; resetToken?: string | null }
  | { kind: "error"; message: string };

function errorToMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return `${err.message} (status ${err.status})`;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<UiState>({ kind: "idle" });

  const subtitle = useMemo(
    () => "Forgot password • Request a reset token • Retro secure flow",
    []
  );

  return (
    <AppShell title="Resident Directory" subtitle={subtitle}>
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Forgot password</div>
          <span className="badge">Self-service reset</span>
        </div>

        <div className="cardBody">
          <div className="notice" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>
              Enter your account email
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              If the account exists, you’ll receive reset instructions. (This
              form always shows the same success message.)
            </div>
          </div>

          {state.kind === "error" && (
            <div className="notice noticeError" role="alert" style={{ marginBottom: 12 }}>
              {state.message}
            </div>
          )}

          {state.kind === "done" && (
            <div className="notice noticeSuccess" role="status" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>
                If an account exists, reset instructions were issued.
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                You can now proceed to the reset page.
              </div>

              {state.resetToken ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>
                    DEV token (only shown when backend email sending is disabled)
                  </div>
                  <div className="notice" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {state.resetToken}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link className="btn btnPrimary" href={`/reset-password?token=${encodeURIComponent(state.resetToken)}`}>
                      Continue to reset
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="fieldRow" style={{ gap: 12 }}>
            <div>
              <div className="label">Email</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@building.com"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btnPrimary"
                disabled={state.kind === "loading" || !email.trim()}
                onClick={async () => {
                  setState({ kind: "loading" });
                  try {
                    const res = await apiForgotPassword(email.trim());
                    setState({ kind: "done", resetToken: res.resetToken ?? null });
                  } catch (e) {
                    setState({ kind: "error", message: errorToMessage(e) });
                  }
                }}
              >
                {state.kind === "loading" ? "Requesting…" : "Request reset"}
              </button>

              <Link className="btn" href="/login">
                Back to login
              </Link>
            </div>

            {state.kind === "idle" && (
              <div className="notice" role="status">
                Tip: In dev mode, the backend may return a reset token directly.
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
