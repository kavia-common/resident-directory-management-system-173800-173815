"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import type { Resident, ResidentPrivacySettings } from "@/lib/types";
import {
  ApiError,
  apiCreateUpdateRequest,
  apiGetMyPrivacySettings,
  apiGetResident,
  apiUpdateMyPrivacySettings,
} from "@/lib/apiClient";
import Link from "next/link";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; resident: Resident }
  | { kind: "submitted" };

type PrivacyStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; settings: ResidentPrivacySettings }
  | { kind: "saving" }
  | { kind: "saved" };

function errMsg(e: unknown): string {
  if (e instanceof ApiError) return `${e.message} (status ${e.status})`;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

export default function MyProfilePage() {
  const { user, state } = useAuth();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>({
    kind: "idle",
  });

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [directoryOptOut, setDirectoryOptOut] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(true);
  const [emailVisible, setEmailVisible] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.residentId) return;
      setStatus({ kind: "loading" });
      setPrivacyStatus({ kind: "loading" });

      try {
        const [r, privacy] = await Promise.all([
          apiGetResident(user.residentId),
          apiGetMyPrivacySettings(),
        ]);

        setPhone(r.phone ?? "");
        setEmail(r.email ?? "");
        setStatus({ kind: "loaded", resident: r });

        setDirectoryOptOut(privacy.directoryOptOut);
        setPhoneVisible(privacy.phoneVisible);
        setEmailVisible(privacy.emailVisible);
        setPrivacyStatus({ kind: "loaded", settings: privacy });
      } catch (e) {
        const message =
          "Could not load your resident profile or privacy settings. " + errMsg(e);
        setStatus({ kind: "error", message });
        setPrivacyStatus({ kind: "error", message });
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
                  Phone/email updates use the approval workflow. Privacy settings apply immediately.
                </div>
              </div>

              <div className="card" style={{ marginBottom: 12 }}>
                <div className="cardHeader">
                  <div className="cardTitle">Privacy & Visibility</div>
                  <span className="badge">Resident-controlled</span>
                </div>
                <div className="cardBody">
                  {privacyStatus.kind === "loading" && (
                    <div className="notice" aria-busy="true">
                      Loading privacy settings…
                    </div>
                  )}

                  {privacyStatus.kind === "error" && (
                    <div className="notice noticeError" role="alert">
                      {privacyStatus.message}
                    </div>
                  )}

                  {privacyStatus.kind === "saved" && (
                    <div className="notice noticeSuccess" role="status">
                      Privacy settings saved.
                    </div>
                  )}

                  {(privacyStatus.kind === "loaded" ||
                    privacyStatus.kind === "saving" ||
                    privacyStatus.kind === "saved") && (
                    <>
                      <div className="notice" style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 800, marginBottom: 4 }}>Directory opt-out</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>
                          If enabled, you will not appear in the directory for non-admin users.
                        </div>
                      </div>

                      <div className="fieldRow" style={{ gap: 12 }}>
                        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={directoryOptOut}
                            onChange={(e) => setDirectoryOptOut(e.target.checked)}
                            disabled={privacyStatus.kind === "saving"}
                          />
                          <span style={{ fontWeight: 700 }}>Opt out of directory listing</span>
                        </label>

                        <div className="notice" style={{ marginTop: 4 }}>
                          <div style={{ fontWeight: 800, marginBottom: 4 }}>Field visibility</div>
                          <div style={{ fontSize: 12, opacity: 0.9 }}>
                            Choose which contact fields are visible to non-admin users in the directory.
                          </div>
                        </div>

                        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={phoneVisible}
                            onChange={(e) => setPhoneVisible(e.target.checked)}
                            disabled={privacyStatus.kind === "saving"}
                          />
                          <span style={{ fontWeight: 700 }}>Show my phone number</span>
                        </label>

                        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={emailVisible}
                            onChange={(e) => setEmailVisible(e.target.checked)}
                            disabled={privacyStatus.kind === "saving"}
                          />
                          <span style={{ fontWeight: 700 }}>Show my email address</span>
                        </label>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            className="btn btnPrimary"
                            disabled={privacyStatus.kind === "saving"}
                            onClick={async () => {
                              setPrivacyStatus({ kind: "saving" });
                              try {
                                const updated = await apiUpdateMyPrivacySettings({
                                  directoryOptOut,
                                  phoneVisible,
                                  emailVisible,
                                });
                                setDirectoryOptOut(updated.directoryOptOut);
                                setPhoneVisible(updated.phoneVisible);
                                setEmailVisible(updated.emailVisible);
                                setPrivacyStatus({ kind: "saved" });
                              } catch (e) {
                                setPrivacyStatus({ kind: "error", message: errMsg(e) });
                              }
                            }}
                          >
                            {privacyStatus.kind === "saving" ? "Saving…" : "Save privacy settings"}
                          </button>

                          <Link className="btn" href="/">
                            Back to directory
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="cardHeader">
                  <div className="cardTitle">Contact update request</div>
                  <span className="badge">Admin approval required</span>
                </div>

                <div className="cardBody">
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
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}
