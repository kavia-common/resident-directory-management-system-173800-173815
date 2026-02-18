"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import type { AuditLogEntry } from "@/lib/types";
import { ApiError, apiListAuditLog } from "@/lib/apiClient";
import Link from "next/link";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; entries: AuditLogEntry[] };

function msg(e: unknown): string {
  if (e instanceof ApiError) return `${e.message}. Backend endpoint may not exist yet.`;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

export default function AdminAuditPage() {
  const { hasRole, state: authState } = useAuth();
  const notAdmin = authState.status !== "authenticated" || !hasRole("admin");

  const [state, setState] = useState<State>({ kind: "loading" });

  const load = async () => {
    setState({ kind: "loading" });
    try {
      const data = await apiListAuditLog({ limit: 100 });
      setState({ kind: "loaded", entries: data });
    } catch (e) {
      setState({ kind: "error", message: msg(e) });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell title="Resident Directory" subtitle="Admin dashboard: audit log">
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
            <div className="cardTitle">Audit log</div>
            <button className="btn" onClick={load}>
              Refresh
            </button>
          </div>

          <div className="cardBody">
            {state.kind === "loading" && (
              <div className="notice" aria-busy="true">
                Loading audit log…
              </div>
            )}

            {state.kind === "error" && (
              <div className="notice noticeError" role="alert">
                {state.message}
              </div>
            )}

            {state.kind === "loaded" && state.entries.length === 0 && (
              <div className="notice">No audit entries.</div>
            )}

            {state.kind === "loaded" && state.entries.length > 0 && (
              <div className="tableWrap">
                <table className="table" aria-label="Audit log table">
                  <thead>
                    <tr>
                      <th>At</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.entries.map((e) => (
                      <tr key={e.id}>
                        <td>{e.at}</td>
                        <td>{e.actorEmail ?? e.actorUserId ?? "—"}</td>
                        <td>{e.action}</td>
                        <td>
                          {e.entityType}
                          {e.entityId ? `:${e.entityId}` : ""}
                        </td>
                        <td>
                          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.9 }}>
                            {e.metadata ? JSON.stringify(e.metadata, null, 2) : "—"}
                          </pre>
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
