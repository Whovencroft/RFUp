import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { getSocket, joinSupervisorRoom } from "../lib/socket";

export default function GmPanel() {
  const [activeTab, setActiveTab] = useState<"sessions" | "notifications" | "incidents">("sessions");
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: "", gmNotes: "", llmProvider: "", llmModel: "" });
  const [error, setError] = useState("");

  const { data: sessions, refetch: refetchSessions } = trpc.sessions.listAll.useQuery();
  const { data: notifications, refetch: refetchNotifications } = trpc.sessions.getNotifications.useQuery({ limit: 100 });
  const { data: llmStatus } = trpc.auth.llmStatus.useQuery();

  const createSession = trpc.sessions.create.useMutation({
    onSuccess: () => { refetchSessions(); setShowCreateSession(false); setSessionForm({ title: "", gmNotes: "", llmProvider: "", llmModel: "" }); },
    onError: (err) => setError(err.message),
  });

  const endSession = trpc.sessions.endSession.useMutation({ onSuccess: () => refetchSessions() });
  const markRead = trpc.sessions.markNotificationsRead.useMutation({ onSuccess: () => refetchNotifications() });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  // Join supervisor room for real-time notifications
  useEffect(() => {
    const socket = getSocket();
    joinSupervisorRoom();

    socket.on("notification:new", () => refetchNotifications());

    return () => {
      socket.off("notification:new");
    };
  }, []);

  const NOTIF_ICONS: Record<string, string> = {
    player_acted: "⚡",
    turn_waiting: "⏳",
    player_inactive: "💤",
    player_kicked: "🚫",
    turn_skipped: "⏭",
  };

  function timeAgo(date: Date | string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Shift Supervisor Panel</h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            AI GM: {llmStatus?.isConfigured ? `${llmStatus.provider} / ${llmStatus.model}` : "Supervisor-only mode (no LLM configured)"}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateSession(!showCreateSession)}>
          + New Session
        </button>
      </div>

      {/* Create session form */}
      {showCreateSession && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 1rem" }}>Create Session</h4>
          <form onSubmit={(e) => { e.preventDefault(); setError(""); createSession.mutate(sessionForm); }}>
            <div className="form-group">
              <label>Session Title</label>
              <input value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} placeholder="Operation: Midnight Patch" required />
            </div>
            <div className="form-group">
              <label>GM Notes / Scenario Context</label>
              <textarea value={sessionForm.gmNotes} onChange={(e) => setSessionForm({ ...sessionForm, gmNotes: e.target.value })} placeholder="Scenario background, objectives, tone…" rows={3} />
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Override LLM Provider (optional)</label>
                <input value={sessionForm.llmProvider} onChange={(e) => setSessionForm({ ...sessionForm, llmProvider: e.target.value })} placeholder="openai / anthropic / ollama" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Override LLM Model (optional)</label>
                <input value={sessionForm.llmModel} onChange={(e) => setSessionForm({ ...sessionForm, llmModel: e.target.value })} placeholder="gpt-4o / claude-3-5-sonnet…" />
              </div>
            </div>
            {error && <div style={{ color: "var(--red)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={createSession.isPending}>
                {createSession.isPending ? "Creating…" : "Create Session"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreateSession(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        {[
          { key: "sessions", label: "Sessions", count: sessions?.length },
          { key: "notifications", label: "Notifications", count: unreadCount, highlight: unreadCount > 0 },
          { key: "incidents", label: "Incidents" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.key ? "var(--teal)" : "transparent"}`,
              color: activeTab === tab.key ? "var(--teal)" : "var(--text-muted)",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: activeTab === tab.key ? 600 : 400,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                background: tab.highlight ? "var(--teal)" : "var(--bg-muted)",
                color: tab.highlight ? "#000" : "var(--text-muted)",
                borderRadius: "10px",
                padding: "0 0.4rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {activeTab === "sessions" && (
        <div>
          {!sessions || sessions.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No sessions yet. Create one above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} onEnd={() => endSession.mutate({ sessionId: s.id })} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </span>
            {unreadCount > 0 && (
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} onClick={() => markRead.mutate({})}>
                Mark all read
              </button>
            )}
          </div>

          {!notifications || notifications.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No notifications yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="card"
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                    opacity: n.isRead ? 0.6 : 1,
                    borderColor: !n.isRead ? "var(--teal-muted)" : "var(--border)",
                    cursor: !n.isRead ? "pointer" : "default",
                    padding: "0.75rem 1rem",
                  }}
                  onClick={() => !n.isRead && markRead.mutate({ ids: [n.id] })}
                >
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{NOTIF_ICONS[n.type] ?? "📋"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem" }}>{n.message}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.2rem", fontFamily: "var(--font-mono)" }}>
                      {n.sessionTitle} · {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--teal)", flexShrink: 0, marginTop: "4px" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Incidents tab */}
      {activeTab === "incidents" && (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
          <p>Manage incidents from the <Link to="/incidents" style={{ color: "var(--teal)" }}>Incidents page</Link>.</p>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onEnd }: { session: any; onEnd: () => void }) {
  const [showInvite, setShowInvite] = useState(false);
  const { data: players } = trpc.sessions.getPlayers.useQuery({ sessionId: session.id });
  const generateInvite = trpc.sessions.generateInviteCode.useMutation();

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>{session.title}</span>
            {session.status === "active" ? (
              <span className="badge badge-teal">Active</span>
            ) : session.status === "waiting" ? (
              <span className="badge badge-yellow">Waiting</span>
            ) : (
              <span className="badge badge-muted">Completed</span>
            )}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
            {players?.filter((p) => p.isActive).length ?? 0} operators · Session #{session.id}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <Link to={`/sessions/${session.id}`} className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}>
            View
          </Link>
          <button
            className="btn btn-ghost"
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
            onClick={() => {
              setShowInvite(!showInvite);
              if (!showInvite) generateInvite.mutate({ sessionId: session.id });
            }}
          >
            Invite
          </button>
          {session.status !== "completed" && (
            <button className="btn btn-danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }} onClick={onEnd}>
              End
            </button>
          )}
        </div>
      </div>

      {showInvite && generateInvite.data && (
        <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--bg-muted)", borderRadius: "6px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "0.35rem" }}>Share this invite code with players:</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", color: "var(--teal)", letterSpacing: "0.15em" }}>
            {generateInvite.data.code}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
            Expires: {generateInvite.data.expiresAt ? new Date(generateInvite.data.expiresAt).toLocaleString() : "Never"}
          </div>
        </div>
      )}

      {/* Active players */}
      {players && players.filter((p) => p.isActive).length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {players.filter((p) => p.isActive).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "var(--bg-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}>
              {p.charAvatarUrl && (
                <img src={p.charAvatarUrl} alt="" style={{ width: "18px", height: "18px", borderRadius: "2px", objectFit: "cover" }} />
              )}
              <span>{p.charName ?? p.displayName ?? p.username}</span>
              {session.currentTurnUserId === p.userId && <span style={{ color: "var(--teal)" }}>▶</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
