"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import type { FavoriteResident } from "@/lib/types";
import { ApiError, apiListFavorites } from "@/lib/apiClient";
import Link from "next/link";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; favorites: FavoriteResident[] };

function errorToMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return `${err.message}. Backend may not have implemented this endpoint yet.`;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export default function FavoritesPage() {
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  const favorites = useMemo(() => (state.kind === "loaded" ? state.favorites : []), [state]);

  const load = async () => {
    setState({ kind: "loading" });
    try {
      const data = await apiListFavorites();
      setState({ kind: "loaded", favorites: data });
    } catch (e) {
      setState({ kind: "error", message: errorToMessage(e) });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell title="Resident Directory" subtitle="Your favorites (quick access)">
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Favorites</div>
          <span className="badge">{favorites.length} saved</span>
        </div>

        <div className="cardBody">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <button className="btn btnPrimary" onClick={load} disabled={state.kind === "loading"}>
              {state.kind === "loading" ? "Refreshing…" : "Refresh"}
            </button>
            <Link className="btn" href="/">
              Back to directory
            </Link>
          </div>

          {state.kind === "loading" && (
            <div className="notice" aria-busy="true">
              Loading favorites…
            </div>
          )}

          {state.kind === "error" && (
            <div className="notice noticeError" role="alert">
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Couldn’t load favorites</div>
              <div>{state.message}</div>
            </div>
          )}

          {state.kind === "loaded" && favorites.length === 0 && (
            <div className="notice" role="status">
              <div style={{ fontWeight: 800, marginBottom: 4 }}>No favorites yet</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                Go to the directory and click “Favorite” on residents you want quick access to.
              </div>
            </div>
          )}

          {state.kind === "loaded" && favorites.length > 0 && (
            <div className="tableWrap">
              <table className="table" role="table" aria-label="Favorites table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {favorites.map((f) => (
                    <tr key={f.resident.id}>
                      <td>
                        <Link
                          href={`/residents/${encodeURIComponent(
                            f.resident.id
                          )}`}
                        >
                          {f.resident.name}
                        </Link>
                      </td>
                      <td>{f.resident.unit}</td>
                      <td>
                        {f.resident.phone ? (
                          f.resident.phone
                        ) : (
                          <span style={{ opacity: 0.7, fontStyle: "italic" }}>Hidden/—</span>
                        )}
                      </td>
                      <td>
                        {f.resident.email ? (
                          f.resident.email
                        ) : (
                          <span style={{ opacity: 0.7, fontStyle: "italic" }}>Hidden/—</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, opacity: 0.9 }}>
                        {new Date(f.favoritedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
