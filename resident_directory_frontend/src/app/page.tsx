"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import type { Resident } from "@/lib/types";
import {
  ApiError,
  apiAddFavorite,
  apiGetFavoriteStatus,
  apiListResidents,
  apiRemoveFavorite,
} from "@/lib/apiClient";
import FavoriteButton from "@/components/FavoriteButton";
import Link from "next/link";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; residents: Resident[] };

function errorToMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return `${err.message}. Backend may not have implemented this endpoint yet.`;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export default function DirectoryPage() {
  const [q, setQ] = useState("");
  const [unit, setUnit] = useState("");
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  // residentId -> favorite boolean (unknown => missing key)
  const [favByResidentId, setFavByResidentId] = useState<Record<string, boolean>>({});
  const [favErrorByResidentId, setFavErrorByResidentId] = useState<Record<string, string>>({});

  const title = "Resident Directory";
  const subtitle = "Search by name or filter by unit. Admins manage residents & approvals.";

  const residents = useMemo(() => {
    if (state.kind !== "loaded") return [];
    return state.residents;
  }, [state]);

  const loadFavoriteStatuses = async (rows: Resident[]) => {
    // Best-effort; load in parallel and ignore individual failures (but show inline error).
    await Promise.all(
      rows.map(async (r) => {
        try {
          const res = await apiGetFavoriteStatus(r.id);
          setFavByResidentId((prev) => ({ ...prev, [r.id]: res.isFavorite }));
          setFavErrorByResidentId((prev) => {
            const copy = { ...prev };
            delete copy[r.id];
            return copy;
          });
        } catch (e) {
          const msg = errorToMessage(e);
          setFavErrorByResidentId((prev) => ({ ...prev, [r.id]: msg }));
        }
      })
    );
  };

  const load = async () => {
    setState({ kind: "loading" });
    try {
      const data = await apiListResidents({
        q: q.trim() || undefined,
        unit: unit.trim() || undefined,
      });
      setState({ kind: "loaded", residents: data });

      // Reset favorite state to avoid stale entries for old result sets.
      setFavByResidentId({});
      setFavErrorByResidentId({});
      void loadFavoriteStatuses(data);
    } catch (e) {
      setState({ kind: "error", message: errorToMessage(e) });
    }
  };

  useEffect(() => {
    // initial load
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title={title} subtitle={subtitle}>
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Directory</div>
          <span className="badge">{residents.length} results</span>
        </div>

        <div className="cardBody">
          <div className="fieldRow fieldRow2">
            <div>
              <div className="label">Search name</div>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g., Taylor"
              />
            </div>
            <div>
              <div className="label">Unit</div>
              <input
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., 12B"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" onClick={load} disabled={state.kind === "loading"}>
              {state.kind === "loading" ? "Searching…" : "Search"}
            </button>
            <button
              className="btn"
              onClick={() => {
                setQ("");
                setUnit("");
                // reload after clearing
                setTimeout(() => void load(), 0);
              }}
              disabled={state.kind === "loading"}
            >
              Clear
            </button>
          </div>

          {state.kind === "error" && (
            <div className="notice noticeError" role="alert" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Couldn’t load residents</div>
              <div>{state.message}</div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                If you’re running locally, ensure <code>NEXT_PUBLIC_API_BASE_URL</code> points to the
                FastAPI server (e.g. http://localhost:3001).
              </div>
            </div>
          )}

          {state.kind === "loading" && (
            <div className="notice" style={{ marginTop: 12 }} aria-busy="true">
              Loading residents…
            </div>
          )}

          {state.kind === "loaded" && state.residents.length === 0 && (
            <div className="notice" style={{ marginTop: 12 }}>
              No residents found. Try a different search or clear filters.
            </div>
          )}

          {state.kind === "loaded" && state.residents.length > 0 && (
            <div className="tableWrap" style={{ marginTop: 12 }}>
              <table className="table" role="table" aria-label="Resident directory table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th style={{ width: 260 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.residents.map((r) => {
                    const isFavorite = favByResidentId[r.id] ?? false;
                    const favKnown = Object.prototype.hasOwnProperty.call(favByResidentId, r.id);
                    const favErr = favErrorByResidentId[r.id];

                    return (
                      <tr key={r.id}>
                        <td>
                          <Link href={`/residents/${encodeURIComponent(r.id)}`}>
                            {r.name}
                          </Link>
                        </td>
                        <td>{r.unit}</td>
                        <td>
                          {r.phone ? (
                            r.phone
                          ) : (
                            <span style={{ opacity: 0.7, fontStyle: "italic" }}>Hidden/—</span>
                          )}
                        </td>
                        <td>
                          {r.email ? (
                            r.email
                          ) : (
                            <span style={{ opacity: 0.7, fontStyle: "italic" }}>Hidden/—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <FavoriteButton
                              isFavorite={isFavorite}
                              disabled={!favKnown && !!favErr}
                              onToggle={async () => {
                                // Optimistic update
                                setFavByResidentId((prev) => ({ ...prev, [r.id]: !isFavorite }));
                                try {
                                  if (isFavorite) {
                                    await apiRemoveFavorite(r.id);
                                  } else {
                                    await apiAddFavorite(r.id);
                                  }
                                  setFavErrorByResidentId((prev) => {
                                    const copy = { ...prev };
                                    delete copy[r.id];
                                    return copy;
                                  });
                                } catch (e) {
                                  // revert on failure
                                  setFavByResidentId((prev) => ({ ...prev, [r.id]: isFavorite }));
                                  setFavErrorByResidentId((prev) => ({ ...prev, [r.id]: errorToMessage(e) }));
                                }
                              }}
                            />

                            <Link className="btn" href={`/household/${encodeURIComponent(r.id)}`}>
                              Household
                            </Link>
                          </div>

                          {!favKnown && !favErr && (
                            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>Loading favorite…</div>
                          )}

                          {favErr && (
                            <div style={{ marginTop: 6, fontSize: 12 }}>
                              <span style={{ color: "rgba(255,255,255,0.85)" }}>
                                Fav status error:{" "}
                              </span>
                              <span style={{ opacity: 0.9 }}>{favErr}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
