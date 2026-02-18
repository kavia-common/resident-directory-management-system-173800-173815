"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import type { Resident } from "@/lib/types";
import { ApiError, apiGetResident } from "@/lib/apiClient";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string; status?: number }
  | { kind: "loaded"; resident: Resident };

function errorToMessage(err: unknown): { message: string; status?: number } {
  if (err instanceof ApiError) {
    // Note: backend uses 404 to enforce directory opt-out privacy for non-admins.
    const statusHint =
      err.status === 404
        ? "Not found (or not visible due to privacy settings)."
        : `Request failed (status ${err.status}).`;
    return {
      message: `${statusHint} ${err.message}`.trim(),
      status: err.status,
    };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: "Unknown error" };
}

// PUBLIC_INTERFACE
export default function ResidentProfileClientPage({
  residentId,
}: {
  /** Resident id to fetch profile for. */
  residentId: string;
}) {
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  const resident = useMemo(
    () => (state.kind === "loaded" ? state.resident : null),
    [state]
  );

  async function load() {
    setState({ kind: "loading" });
    try {
      const data = await apiGetResident(residentId);
      setState({ kind: "loaded", resident: data });
    } catch (e) {
      const { message, status } = errorToMessage(e);
      setState({ kind: "error", message, status });
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [residentId]);

  return (
    <AppShell title="Resident Directory" subtitle="Resident profile">
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Profile</div>
          <span className="badge">
            {resident ? `Unit ${resident.unit}` : "Unit —"}
          </span>
        </div>

        <div className="cardBody">
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <button
              className="btn btnPrimary"
              onClick={() => void load()}
              disabled={state.kind === "loading"}
            >
              {state.kind === "loading" ? "Refreshing…" : "Refresh"}
            </button>

            <Link className="btn" href="/">
              Back to directory
            </Link>

            <Link className="btn" href="/favorites">
              Favorites
            </Link>

            {resident ? (
              <Link
                className="btn"
                href={`/household/${encodeURIComponent(resident.id)}`}
              >
                Household
              </Link>
            ) : null}
          </div>

          {state.kind === "loading" && (
            <div className="notice" aria-busy="true">
              Loading resident profile…
            </div>
          )}

          {state.kind === "error" && (
            <div className="notice noticeError" role="alert">
              <div style={{ fontWeight: 800, marginBottom: 4 }}>
                Couldn’t load profile
              </div>
              <div>{state.message}</div>
              {state.status === 404 ? (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                  If you’re signed in as a non-admin, this can happen when the
                  resident opted out of appearing in the directory.
                </div>
              ) : null}
            </div>
          )}

          {state.kind === "loaded" && (
            <>
              <div className="notice" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>
                  {state.resident.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  Unit {state.resident.unit} • Contact fields respect privacy
                  settings (may appear as hidden).
                </div>
              </div>

              <div className="card">
                <div className="cardHeader">
                  <div className="cardTitle">Contact</div>
                  <span className="badge">Privacy enforced</span>
                </div>
                <div className="cardBody">
                  <div className="fieldRow fieldRow2">
                    <div>
                      <div className="label">Phone</div>
                      <div className="notice" role="status">
                        {state.resident.phone ? (
                          state.resident.phone
                        ) : (
                          <span style={{ opacity: 0.8, fontStyle: "italic" }}>
                            Hidden/—
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="label">Email</div>
                      <div className="notice" role="status">
                        {state.resident.email ? (
                          state.resident.email
                        ) : (
                          <span style={{ opacity: 0.8, fontStyle: "italic" }}>
                            Hidden/—
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="notice"
                    style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}
                  >
                    Tip: If a contact field is hidden, it’s either not provided
                    or the resident has set it as not visible to non-admin users.
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
