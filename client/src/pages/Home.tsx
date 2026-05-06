import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { trpc } from "../lib/trpc";

export default function Home() {
  const { user } = useAuth();
  const { data: llmStatus } = trpc.auth.llmStatus.useQuery();

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 2rem" }}>
      {/* Hero */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span className="badge badge-teal">FACILITY 404 — UPTIME CRITICAL</span>
          {llmStatus && (
            <span className={`badge ${llmStatus.isConfigured ? "badge-teal" : "badge-muted"}`}>
              AI GM: {llmStatus.isConfigured ? `${llmStatus.provider} / ${llmStatus.model}` : "Supervisor-only mode"}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", margin: "0 0 0.5rem", lineHeight: 1.1 }}>
          Roll for<br />
          <span style={{ color: "var(--teal)" }}>Uptime</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", maxWidth: "520px", margin: "0 0 2rem" }}>
          A self-hosted tabletop RPG for security teams. Six rules, one die pool, and however many incident reports it takes to get through the shift.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {user ? (
            <>
              <Link to="/sessions" className="btn btn-primary">View Sessions</Link>
              <Link to="/operator" className="btn btn-ghost">Operator File</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">Create Account</Link>
              <Link to="/login" className="btn btn-ghost">Sign In</Link>
            </>
          )}
          <Link to="/incidents" className="btn btn-ghost">Active Incidents</Link>
        </div>
      </div>

      {/* Rules summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
        {[
          { title: "Roll for Shoes", body: "Roll a number of d6 equal to your skill level. Take the highest result." },
          { title: "Fail to Grow", body: "If your highest die beats the DC, you succeed. If you fail, gain 1 XP." },
          { title: "Spend XP to Level Up", body: "Spend XP equal to the new level to upgrade a skill or add a sub-skill." },
          { title: "Supervisor Mode", body: "Works without an AI — the Shift Supervisor narrates and adjudicates manually." },
        ].map((rule) => (
          <div key={rule.title} className="card">
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "var(--teal)" }}>{rule.title}</h3>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>{rule.body}</p>
          </div>
        ))}
      </div>

      {/* Setup status */}
      {user?.role === "admin" && (
        <div className="card" style={{ borderColor: "var(--teal-muted)" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem" }}>Deployment Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <StatusRow label="Database" ok={true} detail="SQLite — running" />
            <StatusRow label="Authentication" ok={true} detail="Local bcrypt + JWT" />
            <StatusRow label="AI Game Master" ok={llmStatus?.isConfigured ?? false}
              detail={llmStatus?.isConfigured
                ? `${llmStatus.provider} / ${llmStatus.model}`
                : "Not configured — set LLM_PROVIDER and LLM_API_KEY in .env"} />
            <StatusRow label="Image Generation" ok={false} detail="Set IMAGE_API_KEY and IMAGE_PROVIDER in .env" />
            <StatusRow label="Real-time (WebSocket)" ok={true} detail="Socket.io — active" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem" }}>
      <span style={{ color: ok ? "var(--teal)" : "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.8rem", minWidth: "1rem" }}>
        {ok ? "✓" : "○"}
      </span>
      <span style={{ color: "var(--text-muted)", minWidth: "160px" }}>{label}</span>
      <span style={{ color: ok ? "var(--text)" : "var(--text-dim)" }}>{detail}</span>
    </div>
  );
}
