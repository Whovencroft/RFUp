import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getSocket, joinSession, leaveSession } from "../lib/socket";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: number;
  sessionId: number;
  authorId: number | null;
  authorType: "player" | "ai" | "gm" | "system";
  authorName: string | null;
  content: string;
  rollData: string | null;
  createdAt: Date | string;
}

function RollDisplay({ rollData }: { rollData: string }) {
  try {
    const roll = JSON.parse(rollData);
    const max = Math.max(...roll.dice);
    return (
      <div style={{ marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          {roll.skillName} L{roll.skillLevel}:
        </span>
        {roll.dice.map((d: number, i: number) => (
          <div key={i} className={`die ${d === max ? "highest" : ""}`}>{d}</div>
        ))}
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--teal)", fontWeight: 700, fontSize: "0.875rem" }}>
          = {roll.total}
        </span>
      </div>
    );
  } catch {
    return null;
  }
}

function MessageBubble({ msg, currentUserId }: { msg: Message; currentUserId: number | undefined }) {
  const isOwn = msg.authorId === currentUserId;
  const isAI = msg.authorType === "ai";
  const isGM = msg.authorType === "gm";
  const isSystem = msg.authorType === "system";

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", padding: "0.25rem 0", color: "var(--text-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
        {msg.content}
      </div>
    );
  }

  return (
    <div className="fade-in" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isOwn ? "flex-end" : "flex-start",
      marginBottom: "0.75rem",
    }}>
      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "0.2rem", fontFamily: "var(--font-mono)" }}>
        {msg.authorName ?? "Unknown"}
        {(isAI || isGM) && (
          <span style={{ marginLeft: "0.4rem", color: isAI ? "var(--teal)" : "var(--yellow)" }}>
            [{isAI ? "AI GM" : "SUPERVISOR"}]
          </span>
        )}
      </div>
      <div style={{
        maxWidth: "75%",
        background: isOwn ? "var(--teal-muted)" : isAI ? "var(--bg-muted)" : "var(--bg-card)",
        border: `1px solid ${isAI ? "var(--teal-muted)" : isGM ? "rgba(255,209,102,0.3)" : "var(--border)"}`,
        borderRadius: "8px",
        padding: "0.6rem 0.85rem",
        fontSize: "0.875rem",
        lineHeight: 1.5,
      }}>
        {(isAI || isGM) ? (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        ) : (
          <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
        )}
        {msg.rollData && <RollDisplay rollData={msg.rollData} />}
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id ?? "0");
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; level: number } | null>(null);
  const [joined, setJoined] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session } = trpc.sessions.get.useQuery({ sessionId }, { enabled: !!sessionId });
  const { data: players, refetch: refetchPlayers } = trpc.sessions.getPlayers.useQuery({ sessionId }, { enabled: !!sessionId });
  const { data: char } = trpc.character.get.useQuery();
  const { data: initialMessages } = trpc.sessions.getMessages.useQuery({ sessionId, limit: 100 }, { enabled: !!sessionId });

  const submitAction = trpc.sessions.submitAction.useMutation({
    onSuccess: (data) => {
      if (data.playerMessage) {
        setMessages((prev) => [...prev, data.playerMessage as Message]);
      }
      if (data.aiMessage) {
        setMessages((prev) => [...prev, data.aiMessage as Message]);
      }
      setInput("");
      setSelectedSkill(null);
    },
  });

  const joinMutation = trpc.sessions.join.useMutation({
    onSuccess: () => {
      setJoined(true);
      refetchPlayers();
    },
  });

  // Load initial messages
  useEffect(() => {
    if (initialMessages) {
      setMessages([...initialMessages].reverse() as Message[]);
    }
  }, [initialMessages]);

  // Check if already joined
  useEffect(() => {
    if (players && user) {
      const isJoined = players.some((p) => p.userId === user.id && p.isActive);
      setJoined(isJoined);
    }
  }, [players, user]);

  // Socket.io real-time
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    joinSession(sessionId);

    socket.on("message:new", (data: { sessionId: number; payload: Message }) => {
      if (data.sessionId === sessionId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === data.payload.id)) return prev;
          return [...prev, data.payload];
        });
      }
    });

    socket.on("player:joined", () => refetchPlayers());
    socket.on("player:left", () => refetchPlayers());
    socket.on("turn:changed", () => {});

    return () => {
      leaveSession(sessionId);
      socket.off("message:new");
      socket.off("player:joined");
      socket.off("player:left");
      socket.off("turn:changed");
    };
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    submitAction.mutate({
      sessionId,
      content: input.trim(),
      skillName: selectedSkill?.name,
      skillLevel: selectedSkill?.level,
    });
  };

  const isMyTurn = session?.currentTurnUserId === user?.id || !session?.currentTurnUserId;

  if (!session) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading session…</div>;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 52px)" }}>
      {/* Left panel — players */}
      <div style={{
        width: "220px",
        flexShrink: 0,
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{theme.sessionLabel}</div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.2 }}>{session.title}</div>
          <div style={{ marginTop: "0.35rem" }}>
            {session.status === "active" ? (
              <span className="badge badge-teal">Active</span>
            ) : session.status === "waiting" ? (
              <span className="badge badge-yellow">Waiting</span>
            ) : (
              <span className="badge badge-muted">Completed</span>
            )}
          </div>
        </div>

        <div style={{ padding: "0.75rem 1rem", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            {theme.operatorPluralLabel} ({players?.filter((p) => p.isActive).length ?? 0})
          </div>
          {players?.filter((p) => p.isActive).map((p) => (
            <div key={p.id} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {p.charAvatarUrl ? (
                  <img src={p.charAvatarUrl} alt="" style={{ width: "28px", height: "28px", borderRadius: "4px", objectFit: "cover", border: "1px solid var(--border)" }} />
                ) : (
                  <div style={{ width: "28px", height: "28px", borderRadius: "4px", background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "var(--text-dim)" }}>
                    {(p.displayName ?? p.username ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.charName ?? p.displayName ?? p.username}
                    {p.userId === user?.id && <span style={{ color: "var(--teal)", marginLeft: "0.25rem" }}>◆</span>}
                  </div>
                  {p.charCallsign && (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{p.charCallsign}</div>
                  )}
                </div>
              </div>
              {session.currentTurnUserId === p.userId && (
                <div style={{ marginTop: "0.2rem", fontSize: "0.7rem", color: "var(--teal)", fontFamily: "var(--font-mono)" }}>▶ Active turn</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "3rem 0", fontSize: "0.875rem" }}>
              Session started. Waiting for the first action…
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} currentUserId={user?.id} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Join prompt */}
        {!joined && session.status !== "completed" && (
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
            {!showJoinForm ? (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>You haven't joined this session yet.</span>
                <button className="btn btn-primary" style={{ fontSize: "0.875rem" }} onClick={() => joinMutation.mutate({ sessionId, characterId: char?.id })}>
                  Join Session
                </button>
                <button className="btn btn-ghost" style={{ fontSize: "0.875rem" }} onClick={() => setShowJoinForm(true)}>
                  Join with Invite Code
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="INVITE CODE"
                  style={{ width: "160px", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
                />
                <button
                  className="btn btn-primary"
                  style={{ fontSize: "0.875rem" }}
                  onClick={() => joinMutation.mutate({ sessionId, characterId: char?.id, inviteCode })}
                  disabled={joinMutation.isPending}
                >
                  Join
                </button>
                <button className="btn btn-ghost" style={{ fontSize: "0.875rem" }} onClick={() => setShowJoinForm(false)}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        {joined && session.status !== "completed" && (
          <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
            {/* Skill selector */}
            {char?.skills && char.skills.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", alignSelf: "center" }}>Roll with:</span>
                {char.skills.map((s) => (
                  <button
                    key={s.id}
                    className="btn btn-ghost"
                    style={{
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.75rem",
                      borderColor: selectedSkill?.name === s.name ? "var(--teal)" : "var(--border)",
                      color: selectedSkill?.name === s.name ? "var(--teal)" : "var(--text-muted)",
                    }}
                    onClick={() => setSelectedSkill(selectedSkill?.name === s.name ? null : { name: s.name, level: s.level })}
                  >
                    {s.name} (L{s.level})
                  </button>
                ))}
              </div>
            )}

            {!isMyTurn && session.currentTurnUserId && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "0.5rem", fontFamily: "var(--font-mono)" }}>
                ⏳ Waiting for another player's turn…
              </div>
            )}

            <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={isMyTurn ? "Describe your action… (Enter to send, Shift+Enter for newline)" : "Waiting for your turn…"}
                disabled={!isMyTurn && !!session.currentTurnUserId}
                rows={2}
                style={{ resize: "none" }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitAction.isPending || !input.trim() || (!isMyTurn && !!session.currentTurnUserId)}
                style={{ alignSelf: "flex-end", whiteSpace: "nowrap" }}
              >
                {submitAction.isPending ? "Sending…" : selectedSkill ? `Roll + Act` : "Act"}
              </button>
            </form>
          </div>
        )}

        {session.status === "completed" && (
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg-card)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            This session has ended.
          </div>
        )}
      </div>
    </div>
  );
}
