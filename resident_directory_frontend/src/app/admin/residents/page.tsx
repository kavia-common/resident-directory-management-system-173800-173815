"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import type { Resident } from "@/lib/types";
import {
  ApiError,
  apiAdminCreateResident,
  apiAdminDeleteResident,
  apiAdminUpdateResident,
  apiListResidents,
} from "@/lib/apiClient";
import Link from "next/link";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; residents: Resident[] };

function msg(e: unknown): string {
  if (e instanceof ApiError) return `${e.message}. Backend endpoint may not exist yet.`;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

export default function AdminResidentsPage() {
  const { hasRole, state: authState } = useAuth();

  const [q, setQ] = useState("");
  const [unit, setUnit] = useState("");
  const [resState, setResState] = useState<State>({ kind: "loading" });

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const load = async () => {
    setResState({ kind: "loading" });
    try {
      const data = await apiListResidents({ q: q.trim() || undefined, unit: unit.trim() || undefined });
      setResState({ kind: "loaded", residents: data });
    } catch (e) {
      setResState({ kind: "error", message: msg(e) });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notAdmin = authState.status !== "authenticated" || !hasRole("admin");

  return (
    <AppShell title="Resident Directory" subtitle="Admin dashboard: manage resident profiles">
      {notAdmin ? (
        <section className="card">
          <div className="cardHeader">
            <div className="cardTitle">Admin only</div>
          </div>
          <div className="cardBody">
            <div className="notice noticeError" role="alert">
              You must be logged in as an admin to access this page. <Link href="/login">Login</Link>.
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="cardHeader">
              <div className="cardTitle">Search & List</div>
              <button className="btn" onClick={load}>
                Refresh
              </button>
            </div>
            <div className="cardBody">
              <div className="fieldRow fieldRow2">
                <div>
                  <div className="label">Search name</div>
                  <input className="input" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div>
                  <div className="label">Unit</div>
                  <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>

              {resState.kind === "loading" && (
                <div className="notice" style={{ marginTop: 12 }} aria-busy="true">
                  Loading residents…
                </div>
              )}

              {resState.kind === "error" && (
                <div className="notice noticeError" style={{ marginTop: 12 }} role="alert">
                  {resState.message}
                </div>
              )}

              {resState.kind === "loaded" && (
                <div className="tableWrap" style={{ marginTop: 12 }}>
                  <table className="table" aria-label="Admin resident table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Unit</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th style={{ width: 240 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resState.residents.map((r) => (
                        <tr key={r.id}>
                          <td>{r.name}</td>
                          <td>{r.unit}</td>
                          <td>{r.phone ?? "—"}</td>
                          <td>{r.email ?? "—"}</td>
                          <td style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button
                              className="btn"
                              onClick={async () => {
                                const name = window.prompt("Update name", r.name);
                                if (name === null) return;
                                try {
                                  await apiAdminUpdateResident(r.id, { name });
                                  await load();
                                } catch (e) {
                                  window.alert(msg(e));
                                }
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btnDanger"
                              onClick={async () => {
                                const ok = window.confirm(`Delete resident "${r.name}"?`);
                                if (!ok) return;
                                try {
                                  await apiAdminDeleteResident(r.id);
                                  await load();
                                } catch (e) {
                                  window.alert(msg(e));
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {resState.residents.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ opacity: 0.85 }}>
                            No residents found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="card" style={{ marginTop: 14 }}>
            <div className="cardHeader">
              <div className="cardTitle">Create Resident</div>
              <span className="badge">Admin-managed</span>
            </div>
            <div className="cardBody">
              <div className="fieldRow fieldRow2">
                <div>
                  <div className="label">Name</div>
                  <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div>
                  <div className="label">Unit</div>
                  <input className="input" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
                </div>
                <div>
                  <div className="label">Phone (optional)</div>
                  <input className="input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                </div>
                <div>
                  <div className="label">Email (optional)</div>
                  <input className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="cardFooter">
              <button
                className="btn btnPrimary"
                disabled={!newName.trim() || !newUnit.trim()}
                onClick={async () => {
                  try {
                    await apiAdminCreateResident({
                      name: newName.trim(),
                      unit: newUnit.trim(),
                      phone: newPhone.trim() || null,
                      email: newEmail.trim() || null,
                    });
                    setNewName("");
                    setNewUnit("");
                    setNewPhone("");
                    setNewEmail("");
                    await load();
                  } catch (e) {
                    window.alert(msg(e));
                  }
                }}
              >
                Create
              </button>
              <Link className="btn" href="/admin/import-export">
                Import/Export CSV
              </Link>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
