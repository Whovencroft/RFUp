import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";

const SEVERITY_COLORS: Record<string, string> = {
  low: "badge-muted",
  medium: "badge-yellow",
  high: "badge-red",
  critical: "badge-red",
};

export default function Incidents() {
  const { user } = useAuth();
  const { data: incidents, isLoading, refetch } = trpc.incidents.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "medium" as const, dc: 3 });
  const [error, setError] = useState("");

  const createIncident = trpc.incidents.create.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setForm({ title: "", description: "", severity: "medium", dc: 3 }); },
    onError: (err) => setError(err.message),
  });

  const updateIncident = trpc.incidents.update.useMutation({ onSuccess: () => refetch() });

  if (isLoading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading incidents…</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>Active Incidents</h2>
        {user?.role === "admin" && (
          <button className="btn btn-primary" style={{ fontSize: "0.875rem" }} onClick={() => setShowForm(!showForm)}>
            + New Incident
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 1rem" }}>Create Incident</h4>
          <form onSubmit={(e) => { e.preventDefault(); setError(""); createIncident.mutate(form); }}>
            <div className="form-group">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ransomware detected on PROD-DB-01" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Incident details, context, objectives…" rows={3} required />
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Severity</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as typeof form.severity })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>DC (1–6)</label>
                <input type="number" min={1} max={6} value={form.dc} onChange={(e) => setForm({ ...form, dc: parseInt(e.target.value) })} />
              </div>
            </div>
            {error && <div style={{ color: "var(--red)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={createIncident.isPending}>
                {createIncident.isPending ? "Creating…" : "Create Incident"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!incidents || incidents.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>No incidents on record.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {incidents.map((inc) => (
            <div key={inc.id} className="card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <span style={{ fontWeight: 600 }}>{inc.title}</span>
                    <span className={`badge ${SEVERITY_COLORS[inc.severity] ?? "badge-muted"}`}>{inc.severity.toUpperCase()}</span>
                    {inc.dc && <span className="badge badge-muted" style={{ fontFamily: "var(--font-mono)" }}>DC {inc.dc}</span>}
                    {!inc.isActive && <span className="badge badge-muted">Resolved</span>}
                  </div>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>{inc.description}</p>
                </div>
                {user?.role === "admin" && (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", flexShrink: 0 }}
                    onClick={() => updateIncident.mutate({ id: inc.id, isActive: !inc.isActive })}
                  >
                    {inc.isActive ? "Resolve" : "Reopen"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
