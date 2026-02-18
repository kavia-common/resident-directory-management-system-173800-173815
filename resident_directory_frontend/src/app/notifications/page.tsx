"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import type { AppNotification } from "@/lib/types";
import {
  ApiError,
  apiListMyNotifications,
  apiMarkNotificationsRead,
} from "@/lib/apiClient";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; items: AppNotification[] };

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

function rowBadgeClass(n: AppNotification): string {
  if (!n.isRead) return "badge btnPrimary";
  return "badge";
}

// PUBLIC_INTERFACE
export default function NotificationsPage() {
  /** Resident-facing in-app notifications for approval/rejection updates. */
  const { state, user, hasRole } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>({ kind: "idle" });
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);

  const items = useMemo(() => {
    if (loadState.kind !== "loaded") return [];
    return loadState.items;
  }, [loadState]);

  async function load() {
    if (state.status !== "authenticated") return;
    if (!hasRole("resident")) return;

    setLoadState({ kind: "loading" });
    try {
      const data = await apiListMyNotifications({
        unreadOnly: showUnreadOnly,
        limit: 200,
      });
      setLoadState({ kind: "loaded", items: data });
    } catch (e) {
      setLoadState({
        kind: "error",
        message:
          "Could not load notifications. The backend may not have implemented this endpoint yet. " +
          errToMsg(e),
      });
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, showUnreadOnly]);

  async function markAllVisibleAsRead() {
    if (loadState.kind !== "loaded") return;
    const unread = loadState.items.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    try {
      await apiMarkNotificationsRead(unread.map((n) => n.id));
      // Optimistic local update
      setLoadState({
        kind: "loaded",
        items: loadState.items.map((n) =>
          n.isRead
            ? n
            : { ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }
        ),
      });
    } catch (e) {
      setLoadState({
        kind: "error",
        message: "Failed to mark as read: " + errToMsg(e),
      });
    }
  }

  return (
    <AppShell
      title="Resident Directory"
      subtitle="In-app notifications for approvals/rejections"
    >
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Notifications</div>
          <span className="badge" aria-label="Logged in user">
            {state.status === "authenticated" ? `${user?.email}` : "Not logged in"}
          </span>
        </div>

        <div className="cardBody">
          {state.status !== "authenticated" && (
            <div className="notice noticeError" role="alert">
              You must be logged in to view notifications.{" "}
              <Link href="/login">Go to login</Link>.
            </div>
          )}

          {state.status === "authenticated" && !hasRole("resident") && (
            <div className="notice" role="status">
              Notifications are available for resident accounts. Admins can review requests on{" "}
              <Link href="/admin/approvals">Admin: Approvals</Link>.
            </div>
          )}

          {state.status === "authenticated" && hasRole("resident") && !user?.residentId && (
            <div className="notice" role="status">
              Your user is not linked to a resident record. Contact an admin.
            </div>
          )}

          {state.status === "authenticated" && hasRole("resident") && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label className="badge" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  style={{ accentColor: "var(--color-primary)" }}
                />
                Unread only
              </label>

              <button
                className="btn"
                onClick={() => void load()}
                disabled={loadState.kind === "loading"}
              >
                Refresh
              </button>

              <button
                className="btn btnPrimary"
                onClick={() => void markAllVisibleAsRead()}
                disabled={loadState.kind !== "loaded" || items.every((n) => n.isRead)}
              >
                Mark all as read
              </button>
            </div>
          )}

          {loadState.kind === "loading" && (
            <div className="notice" aria-busy="true" style={{ marginTop: 12 }}>
              Loading notifications…
            </div>
          )}

          {loadState.kind === "error" && (
            <div className="notice noticeError" role="alert" style={{ marginTop: 12 }}>
              {loadState.message}
            </div>
          )}

          {loadState.kind === "loaded" && items.length === 0 && (
            <div className="notice" role="status" style={{ marginTop: 12 }}>
              No notifications yet. When an admin approves or rejects one of your change requests,
              you’ll see it here.
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="btn" href="/my-requests">
                  Go to My Requests
                </Link>
                <Link className="btn btnPrimary" href="/me">
                  Go to My Profile
                </Link>
              </div>
            </div>
          )}

          {loadState.kind === "loaded" && items.length > 0 && (
            <div className="tableWrap" style={{ marginTop: 12 }}>
              <table className="table" role="table" aria-label="Notifications table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>When</th>
                    <th>Title</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <span className={rowBadgeClass(n)}>{n.isRead ? "READ" : "NEW"}</span>
                      </td>
                      <td>{formatDate(n.createdAt)}</td>
                      <td style={{ fontWeight: 800, color: "var(--color-text-strong)" }}>
                        {n.title}
                      </td>
                      <td>{n.body}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" href="/my-requests">
              Back to My Requests
            </Link>
            <Link className="btn" href="/me">
              Back to My Profile
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
