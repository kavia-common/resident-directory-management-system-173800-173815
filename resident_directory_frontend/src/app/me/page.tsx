"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import type { Resident } from "@/lib/types";
import { ApiError, apiCreateUpdateRequest, apiGetResident } from "@/lib/apiClient";
import Link from "next/link";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; resident: Resident }
  | { kind: "submitted" };

function errMsg(e: unknown): string {
  if (e instanceof ApiError) return `${e.message} (status ${e.status})`;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

export default function MyProfilePage() {
  const { user, state } = useAuth();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user?.residentId) return;
      setStatus({ kind: "loading" });
      try {
        const r = await apiGetResident(user.residentId);
        setPhone(r.phone ?? "");
        setEmail(r.email ?? "");
        setStatus({ kind: "loaded", resident: r });
      } catch (e) {
        setStatus({
          kind: "error",
          message:
            "Could not load your resident profile. Backend may not have this endpoint yet. " +
            errMsg(e),
        });
      }
    };

    if (state.status === "authenticated") void load();
  }, [state.status, user?.residentId]);

  return (
    <AppShell title="Resident Directory" subtitle="Your profile (limited self-edit with approval)">
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">My Profile</div>
          {state.status !== "authenticated" ? (
            <span className="badge">Not logged in</span>
          ) : (
            <span className="badge">Self-edit: phone/email only</span>
          )}
        </div>

        <div className="cardBody">
          {state.status !== "authenticated" && (
            <div className="notice noticeError" role="alert">
              You must be logged in to view your profile. <Link href="/login">Go to login</Link>.
            </div>
          )}

          {state.status === "authenticated" && !user?.residentId && (
            <div className="notice" role="status">
              Your user is not linked to a resident record. Contact an admin.
            </div>
          )}

          {status.kind === "error" && (
            <div className="notice noticeError" role="alert">
              {status.message}
            </div>
          )}

          {status.kind === "submitted" && (
            <div className="notice noticeSuccess" role="status">
              Update request submitted. An admin must approve changes before they appear in the directory.
            </div>
          )}

          {status.kind === "loading" && (
            <div className="notice" aria-busy="true">
              Loading your profile…
            </div>
          )}

          {status.kind === "loaded" && (
            <>
              <div className="notice" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>
                  {status.resident.name} • Unit {status.resident.unit}
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  Only phone/email updates are allowed via approval workflow.
                </div>
              </div>

              <div className="fieldRow fieldRow2">
                <div>
                  <div className="label">Phone</div>
                  <input
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional"
                    inputMode="tel"
                  />
                </div>
                <div>
                  <div className="label">Email</div>
                  <input
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Optional"
                    inputMode="email"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  className="btn btnPrimary"
                  onClick={async () => {
                    setStatus({ kind: "loading" });
                    try {
                      await apiCreateUpdateRequest({
                        residentId: status.resident.id,
                        fields: {
                          phone: phone.trim() || null,
                          email: email.trim() || null,
                        },
                      });
                      setStatus({ kind: "submitted" });
                    } catch (e) {
                      setStatus({ kind: "error", message: errMsg(e) });
                    }
                  }}
                >
                  Submit update request
                </button>
                <Link className="btn" href="/">
                  Back to directory
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}
