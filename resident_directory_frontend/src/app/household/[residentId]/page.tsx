"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import type { Household } from "@/lib/types";
import { ApiError, apiGetHousehold } from "@/lib/apiClient";
import Link from "next/link";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; household: Household };

function errorToMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return `${err.message}. Backend may not have implemented this endpoint yet.`;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export default function HouseholdPage({ params }: { params: { residentId: string } }) {
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  const members = useMemo(() => (state.kind === "loaded" ? state.household.members : []), [state]);
  const unit = state.kind === "loaded" ? state.household.unit : "";

  const load = async () => {
    setState({ kind: "loading" });
    try {
      const data = await apiGetHousehold(params.residentId);
      setState({ kind: "loaded", household: data });
    } catch (e) {
      setState({ kind: "error", message: errorToMessage(e) });
    }
  };

  useEffect(() => {
    void load();
  }, [params.residentId]);

  return (
    <AppShell title="Resident Directory" subtitle="Household view (same unit)">
      <section className="card">
        <div className="cardHeader">
          <div className="cardTitle">Household</div>
          <span className="badge">{state.kind === "loaded" ? `Unit ${unit}` : "Unit —"}</span>
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
              Loading household…
            </div>
          )}

          {state.kind === "error" && (
            <div className="notice noticeError" role="alert">
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Couldn’t load household</div>
              <div>{state.message}</div>
            </div>
          )}

          {state.kind === "loaded" && members.length === 0 && (
            <div className="notice" role="status">
              No active residents found for this unit.
            </div>
          )}

          {state.kind === "loaded" && members.length > 0 && (
            <div className="tableWrap">
              <table className="table" role="table" aria-label="Household members table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Phone</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((r) => (
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
