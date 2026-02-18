"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, apiChangePassword } from "@/lib/apiClient";

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

export default function ChangePasswordPage() {
  const { state } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ui, setUi] = useState<UiState>({ kind: "idle" });

  const subtitle = useMemo(() => "Change password • Authenticated", []);

  const passwordsMatch = newPassword.length > 0 && newPassword === confirm;

  return (
    <AppShell title="Resident Directory" subtitle={subtitle}>
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Change password</div>
          <span className="badge">Signed-in users</span>
        </div>

        <div className="cardBody">
          {state.status !== "authenticated" && (
            <div className="notice noticeError" role="alert" style={{ marginBottom: 12 }}>
              You must be logged in to change your password. <Link href="/login">Go to login</Link>.
            </div>
          )}

          {ui.kind === "error" && (
            <div className="notice noticeError" role="alert" style={{ marginBottom: 12 }}>
              {ui.message}
            </div>
          )}

          {ui.kind === "done" && (
            <div className="notice noticeSuccess" role="status" style={{ marginBottom: 12 }}>
              Password changed successfully.
            </div>
          )}

          {state.status === "authenticated" && (
            <div className="fieldRow" style={{ gap: 12 }}>
              <div>
                <div className="label">Current password</div>
                <input
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your current password"
                />
              </div>

              <div className="fieldRow fieldRow2">
                <div>
                  <div className="label">New password</div>
                  <input
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div>
                  <div className="label">Confirm new password</div>
                  <input
                    className="input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
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
                    ui.kind === "loading" ||
                    !currentPassword ||
                    newPassword.length < 8 ||
                    !passwordsMatch
                  }
                  onClick={async () => {
                    setUi({ kind: "loading" });
                    try {
                      await apiChangePassword({
                        currentPassword,
                        newPassword,
                      });
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirm("");
                      setUi({ kind: "done" });
                    } catch (e) {
                      setUi({ kind: "error", message: errorToMessage(e) });
                    }
                  }}
                >
                  {ui.kind === "loading" ? "Updating…" : "Update password"}
                </button>

                <Link className="btn" href="/me">
                  Back to profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
