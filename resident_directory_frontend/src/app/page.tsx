"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import type { Resident } from "@/lib/types";
import { ApiError, apiListResidents } from "@/lib/apiClient";

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

  const title = "Resident Directory";
  const subtitle = "Search by name or filter by unit. Admins manage residents & approvals.";

  const residents = useMemo(() => {
    if (state.kind !== "loaded") return [];
    return state.residents;
  }, [state]);

  const load = async () => {
    setState({ kind: "loading" });
    try {
      const data = await apiListResidents({ q: q.trim() || undefined, unit: unit.trim() || undefined });
      setState({ kind: "loaded", residents: data });
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
                  </tr>
                </thead>
                <tbody>
                  {state.residents.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
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
