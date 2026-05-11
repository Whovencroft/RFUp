import React from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

function statusBadge(status: string) {
  if (status === "active") return <span className="badge badge-teal">Active</span>;
  if (status === "waiting") return <span className="badge badge-yellow">Waiting</span>;
  return <span className="badge badge-muted">Completed</span>;
}

export default function Sessions() {
  const { user } = useAuth();
  const theme = useTheme();
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery();

  if (isLoading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading sessions…</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0 }}>{theme.sessionPluralLabel}</h2>
        {user?.role === "admin" && (
          <Link to="/gm" className="btn btn-primary" style={{ fontSize: "0.875rem" }}>
            + New Session (GM Panel)
          </Link>
        )}
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>No sessions yet.</p>
          {user?.role === "admin" && (
            <Link to="/gm" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
              Create First Session
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sessions.map((s) => (
            <Link
              key={s.id}
              to={`/sessions/${s.id}`}
              style={{ textDecoration: "none" }}
            >
              <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", transition: "border-color 0.15s", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--teal-muted)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600 }}>{s.title}</span>
                    {statusBadge(s.status)}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                    {new Date(s.createdAt).toLocaleDateString()} · Session #{s.id}
                  </div>
                </div>
                <span style={{ color: "var(--teal)", fontSize: "1rem" }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
