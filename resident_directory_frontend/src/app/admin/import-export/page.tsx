"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, apiExportResidentsCsv, apiImportResidentsCsv } from "@/lib/apiClient";
import Link from "next/link";

function msg(e: unknown): string {
  if (e instanceof ApiError) return `${e.message}. Backend endpoint may not exist yet.`;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

export default function AdminImportExportPage() {
  const { hasRole, state: authState } = useAuth();
  const notAdmin = authState.status !== "authenticated" || !hasRole("admin");

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "success"; message: string }
  >({ kind: "idle" });

  return (
    <AppShell title="Resident Directory" subtitle="Admin dashboard: CSV import/export">
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
            <div className="cardTitle">Import / Export</div>
            <Link className="btn" href="/admin/residents">
              Back to residents
            </Link>
          </div>

          <div className="cardBody">
            {status.kind === "error" && (
              <div className="notice noticeError" role="alert">
                {status.message}
              </div>
            )}
            {status.kind === "success" && (
              <div className="notice noticeSuccess" role="status">
                {status.message}
              </div>
            )}

            <div className="notice" style={{ marginBottom: 12 }}>
              CSV import/export endpoints are expected on the backend. This UI handles loading and error states.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btnPrimary"
                onClick={async () => {
                  setStatus({ kind: "loading" });
                  try {
                    const blob = await apiExportResidentsCsv();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "residents.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                    setStatus({ kind: "success", message: "Export started (download should begin)." });
                  } catch (e) {
                    setStatus({ kind: "error", message: msg(e) });
                  }
                }}
                disabled={status.kind === "loading"}
              >
                Export CSV
              </button>
            </div>

            <hr style={{ margin: "14px 0", borderColor: "rgba(255,255,255,0.14)" }} />

            <div>
              <div className="label">Import CSV file</div>
              <input
                className="input"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button
                className="btn btnPrimary"
                disabled={!file || status.kind === "loading"}
                onClick={async () => {
                  if (!file) return;
                  setStatus({ kind: "loading" });
                  try {
                    const res = await apiImportResidentsCsv(file);
                    setStatus({
                      kind: "success",
                      message: `Import complete. Imported=${res.imported}, Updated=${res.updated}, Errors=${res.errors.length}`,
                    });
                  } catch (e) {
                    setStatus({ kind: "error", message: msg(e) });
                  }
                }}
              >
                Import CSV
              </button>
              <button className="btn" onClick={() => setFile(null)} disabled={status.kind === "loading"}>
                Clear selection
              </button>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
