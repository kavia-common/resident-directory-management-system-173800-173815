"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import type { ResidentUpdateRequest } from "@/lib/types";
import { ApiError, apiListMyUpdateRequests } from "@/lib/apiClient";
import Link from "next/link";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; requests: ResidentUpdateRequest[] };

function errToMsg(e: unknown): string {
  if (e instanceof ApiError) return `${e.message} (status ${e.status})`;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function statusBadgeClass(status: ResidentUpdateRequest["status"]): string {
  // Uses existing theme button colors as a lightweight status indicator.
  if (status === "approved") return "badge noticeSuccess";
  if (status === "rejected") return "badge noticeError";
  return "badge";
}

function statusLabel(status: ResidentUpdateRequest["status"]): string {
  if (status === "approved") return "APPROVED";
  if (status === "rejected") return "REJECTED";
  return "PENDING";
}

// PUBLIC_INTERFACE
export default function MyRequestsPage() {
  /** Resident-facing status tracking for submitted update requests. */
  const { state, user, hasRole } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>({ kind: "idle" });

  const requests = useMemo(() => {
    if (loadState.kind !== "loaded") return [];
    return loadState.requests;
  }, [loadState]);

  useEffect(() => {
    const load = async () => {
      if (state.status !== "authenticated") return;
      if (!hasRole("resident")) return;

      setLoadState({ kind: "loading" });
      try {
        const data = await apiListMyUpdateRequests({ limit: 100 });
        setLoadState({ kind: "loaded", requests: data });
      } catch (e) {
        setLoadState({
          kind: "error",
          message:
            "Could not load your requests. The backend may not have implemented this endpoint yet. " +
            errToMsg(e),
        });
      }
    };

    void load();
  }, [state.status, hasRole]);

  return (
    <AppShell title="Resident Directory" subtitle="Track the status of your submitted change requests">
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">My Requests</div>
          <span className="badge">
            {state.status === "authenticated" ? `${user?.email}` : "Not logged in"}
          </span>
        </div>

        <div className="cardBody">
          {state.status !== "authenticated" && (
            <div className="notice noticeError" role="alert">
              You must be logged in to view your requests. <Link href="/login">Go to login</Link>.
            </div>
          )}

          {state.status === "authenticated" && !hasRole("resident") && (
            <div className="notice" role="status">
              This page is for resident accounts. Admins can review requests on{" "}
              <Link href="/admin/approvals">Admin: Approvals</Link>.
            </div>
          )}

          {state.status === "authenticated" && hasRole("resident") && !user?.residentId && (
            <div className="notice" role="status">
              Your user is not linked to a resident record. Contact an admin.
            </div>
          )}

          {loadState.kind === "loading" && (
            <div className="notice" aria-busy="true">
              Loading your requests…
            </div>
          )}

          {loadState.kind === "error" && (
            <div className="notice noticeError" role="alert">
              {loadState.message}
            </div>
          )}

          {loadState.kind === "loaded" && requests.length === 0 && (
            <div className="notice" role="status">
              No requests yet. Submit a change request from <Link href="/me">My Profile</Link>.
            </div>
          )}

          {loadState.kind === "loaded" && requests.length > 0 && (
            <div className="tableWrap" style={{ marginTop: 8 }}>
              <table className="table" role="table" aria-label="My update requests table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Reviewed</th>
                    <th>Requested changes</th>
                    <th>Admin note</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className={statusBadgeClass(r.status)}>{statusLabel(r.status)}</span>
                      </td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>{formatDate(r.reviewedAt ?? null)}</td>
                      <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                        {Object.keys(r.fields ?? {}).length > 0 ? JSON.stringify(r.fields) : "—"}
                      </td>
                      <td>{r.reviewNote?.trim() ? r.reviewNote : <span style={{ opacity: 0.7 }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Link className="btn" href="/me">
              Back to My Profile
            </Link>
            <button
              className="btn btnPrimary"
              onClick={async () => {
                setLoadState({ kind: "loading" });
                try {
                  const data = await apiListMyUpdateRequests({ limit: 100 });
                  setLoadState({ kind: "loaded", requests: data });
                } catch (e) {
                  setLoadState({ kind: "error", message: errToMsg(e) });
                }
              }}
              disabled={loadState.kind === "loading" || state.status !== "authenticated"}
            >
              Refresh
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
