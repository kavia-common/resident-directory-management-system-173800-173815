"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import type { ResidentUpdateRequest } from "@/lib/types";
import {
  ApiError,
  apiListPendingUpdateRequests,
  apiReviewUpdateRequest,
} from "@/lib/apiClient";
import Link from "next/link";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; requests: ResidentUpdateRequest[] };

function msg(e: unknown): string {
  if (e instanceof ApiError) return `${e.message}. Backend endpoint may not exist yet.`;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

export default function AdminApprovalsPage() {
  const { hasRole, state: authState } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = async () => {
    setState({ kind: "loading" });
    try {
      const data = await apiListPendingUpdateRequests();
      setState({ kind: "loaded", requests: data });
    } catch (e) {
      setState({ kind: "error", message: msg(e) });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const notAdmin = authState.status !== "authenticated" || !hasRole("admin");

  return (
    <AppShell title="Resident Directory" subtitle="Admin dashboard: approval workflow">
      {notAdmin ? (
        <section className="card">
          <div className="cardHeader">
            <div className="cardTitle">Admin only</div>
          </div>
          <div className="cardBody">
            <div className="notice noticeError" role="alert">
              You must be logged in as an admin. <Link href="/login">Login</Link>.
            </div>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="cardHeader">
            <div className="cardTitle">Pending requests</div>
            <button className="btn" onClick={load}>
              Refresh
            </button>
          </div>

          <div className="cardBody">
            {state.kind === "loading" && (
              <div className="notice" aria-busy="true">
                Loading pending update requests…
              </div>
            )}

            {state.kind === "error" && (
              <div className="notice noticeError" role="alert">
                {state.message}
              </div>
            )}

            {state.kind === "loaded" && state.requests.length === 0 && (
              <div className="notice">No pending requests.</div>
            )}

            {state.kind === "loaded" && state.requests.length > 0 && (
              <div className="tableWrap">
                <table className="table" aria-label="Pending update requests table">
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Resident</th>
                      <th>Fields</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.requests.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.residentId}</td>
                        <td>
                          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.9 }}>
                            {JSON.stringify(r.fields, null, 2)}
                          </pre>
                        </td>
                        <td style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            className="btn btnSuccess"
                            onClick={async () => {
                              try {
                                await apiReviewUpdateRequest({
                                  requestId: r.id,
                                  decision: "approved",
                                });
                                await load();
                              } catch (e) {
                                window.alert(msg(e));
                              }
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btnDanger"
                            onClick={async () => {
                              const note = window.prompt("Optional rejection note", "");
                              try {
                                await apiReviewUpdateRequest({
                                  requestId: r.id,
                                  decision: "rejected",
                                  note: note ?? undefined,
                                });
                                await load();
                              } catch (e) {
                                window.alert(msg(e));
                              }
                            }}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </AppShell>
  );
}
