import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import CssIdCard from "../components/CssIdCard";

export default function OperatorFile() {
  const { data: char, isLoading, refetch } = trpc.character.get.useQuery();
  const [form, setForm] = useState({ name: "", callsign: "", jobTitle: "Security Analyst", bio: "" });
  const [avatarDesc, setAvatarDesc] = useState("");
  const [showAvatarForm, setShowAvatarForm] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [error, setError] = useState("");
  // "css" = CSS ID card (no API needed), "ai" = AI-generated image
  const [portraitMode, setPortraitMode] = useState<"css" | "ai">("css");

  const createChar = trpc.character.create.useMutation({
    onSuccess: () => { refetch(); },
    onError: (err) => setError(err.message),
  });

  const generateAvatar = trpc.character.generateAvatar.useMutation({
    onSuccess: () => { refetch(); setShowAvatarForm(false); },
    onError: (err) => setError(err.message),
  });

  const levelUp = trpc.character.levelUpSkill.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => setError(err.message),
  });

  const rollDice = trpc.character.rollDice.useMutation();

  if (isLoading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading operator file…</div>;

  if (!char) {
    return (
      <div style={{ maxWidth: "500px", margin: "4rem auto", padding: "0 2rem" }}>
        <h2>Create Operator File</h2>
        <p style={{ color: "var(--text-muted)" }}>You don't have an operator file yet. Create one to join sessions.</p>
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <form onSubmit={(e) => { e.preventDefault(); setError(""); createChar.mutate(form); }}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Agent Smith" required />
            </div>
            <div className="form-group">
              <label>Callsign (optional)</label>
              <input value={form.callsign} onChange={(e) => setForm({ ...form, callsign: e.target.value })} placeholder="GHOST-7" style={{ fontFamily: "var(--font-mono)" }} />
            </div>
            <div className="form-group">
              <label>Job Title</label>
              <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Security Analyst" required />
            </div>
            <div className="form-group">
              <label>Bio (optional)</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Background, specialties, quirks…" rows={3} />
            </div>
            {error && <div style={{ color: "var(--red)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={createChar.isPending}>
              {createChar.isPending ? "Creating…" : "Create Operator File"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Portrait column */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              className={`btn ${portraitMode === "css" ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1, fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
              onClick={() => setPortraitMode("css")}
            >
              ID Card
            </button>
            <button
              className={`btn ${portraitMode === "ai" ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1, fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
              onClick={() => setPortraitMode("ai")}
            >
              AI Image
            </button>
          </div>

          {/* CSS ID Card */}
          {portraitMode === "css" && (
            <CssIdCard
              name={char.name}
              callsign={char.callsign}
              jobTitle={char.jobTitle}
              xp={char.xp}
              size="small"
              onClick={() => setLightbox(true)}
            />
          )}

          {/* AI portrait */}
          {portraitMode === "ai" && (
            <>
              {char.avatarUrl ? (
                <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setLightbox(true)}>
                  <img
                    src={char.avatarUrl}
                    alt="Operator portrait"
                    style={{ width: "160px", height: "160px", objectFit: "cover", borderRadius: "8px", border: "2px solid var(--border)" }}
                  />
                  <div style={{
                    position: "absolute", bottom: "6px", right: "6px",
                    background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "2px 6px",
                    fontSize: "0.7rem", color: "var(--teal)", fontFamily: "var(--font-mono)"
                  }}>
                    + ZOOM
                  </div>
                </div>
              ) : (
                <div style={{
                  width: "160px", height: "160px", borderRadius: "8px",
                  border: "2px dashed var(--border)", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--text-dim)", fontSize: "0.8rem", textAlign: "center",
                  padding: "1rem"
                }}>
                  No portrait
                </div>
              )}
              <button
                className="btn btn-ghost"
                style={{ fontSize: "0.8rem", padding: "0.35rem" }}
                onClick={() => setShowAvatarForm(!showAvatarForm)}
              >
                {char.avatarUrl ? "Re-generate" : "Generate Portrait"}
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: "240px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h2 style={{ margin: 0 }}>{char.name}</h2>
            {char.callsign && (
              <span className="badge badge-teal" style={{ fontFamily: "var(--font-mono)" }}>{char.callsign}</span>
            )}
          </div>
          <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>{char.jobTitle}</p>
          {char.bio && (
            <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>{char.bio}</p>
          )}
          <div style={{ display: "flex", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>XP</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", color: "var(--teal)" }}>{char.xp}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skills</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem" }}>{char.skills?.length ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI portrait generation form */}
      {showAvatarForm && portraitMode === "ai" && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h4 style={{ margin: "0 0 0.75rem" }}>Generate AI Portrait</h4>
          <div className="form-group">
            <label>Appearance description (optional)</label>
            <textarea
              value={avatarDesc}
              onChange={(e) => setAvatarDesc(e.target.value)}
              placeholder="e.g. mid-30s, short dark hair, cyberpunk tactical gear, serious expression"
              rows={2}
            />
          </div>
          {error && <div style={{ color: "var(--red)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</div>}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => generateAvatar.mutate({ description: avatarDesc })}
              disabled={generateAvatar.isPending}
            >
              {generateAvatar.isPending ? "Generating…" : "Generate"}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAvatarForm(false)}>Cancel</button>
          </div>
          {generateAvatar.isError && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              {generateAvatar.error.message}
            </p>
          )}
        </div>
      )}

      {/* Skills */}
      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>Skill Manifest</h3>
        {char.skills && char.skills.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {char.skills.map((skill) => (
              <div key={skill.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{skill.name}</span>
                  <span style={{ marginLeft: "0.5rem", color: "var(--text-dim)", fontSize: "0.8rem" }}>
                    Level {skill.level} — roll {skill.level}d6
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                    onClick={() => rollDice.mutate({ skillName: skill.name, skillLevel: skill.level })}
                    disabled={rollDice.isPending}
                  >
                    Roll
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "var(--teal)" }}
                    onClick={() => levelUp.mutate({ skillId: skill.id })}
                    disabled={levelUp.isPending}
                    title={`Cost: ${skill.level + 1} XP`}
                  >
                    Level Up ({skill.level + 1} XP)
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No skills yet.</p>
        )}

        {/* Dice result */}
        {rollDice.data && (
          <div className="card" style={{ marginTop: "1rem", borderColor: "var(--teal-muted)" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              {rollDice.data.skillName} — Level {rollDice.data.skillLevel}
            </div>
            <div className="dice-result">
              {rollDice.data.dice.map((d, i) => (
                <div key={i} className={`die ${d === rollDice.data!.total ? "highest" : ""}`}>{d}</div>
              ))}
              <span style={{ marginLeft: "0.5rem", fontFamily: "var(--font-mono)", color: "var(--teal)", fontWeight: 700 }}>
                = {rollDice.data.total}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox — CSS card */}
      {lightbox && portraitMode === "css" && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
            <CssIdCard
              name={char.name}
              callsign={char.callsign}
              jobTitle={char.jobTitle}
              xp={char.xp}
              size="large"
            />
            <button
              onClick={() => setLightbox(false)}
              className="btn btn-ghost"
              style={{ position: "absolute", top: "-2.5rem", right: 0, padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Lightbox — AI image */}
      {lightbox && portraitMode === "ai" && char.avatarUrl && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
            <img
              src={char.avatarUrl}
              alt="Operator portrait"
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: "8px", border: "2px solid var(--border)" }}
            />
            <div style={{ textAlign: "center", marginTop: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
              {char.name}{char.callsign ? ` · ${char.callsign}` : ""} · {char.jobTitle}
            </div>
            <button
              onClick={() => setLightbox(false)}
              className="btn btn-ghost"
              style={{ position: "absolute", top: "-2.5rem", right: 0, padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
