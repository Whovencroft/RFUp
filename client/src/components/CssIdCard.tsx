/**
 * CssIdCard — pure CSS/HTML ID card portraits.
 *
 * Four designs:
 *   "scifi"    — original Facility 404 dark-teal institutional badge
 *   "federal"  — US Federal PIV-style badge (white card, blue stripe, chip)
 *   "military" — DoD CAC-style horizontal card (branch seal, rank fields)
 *   "corporate"— Corporate security access card (dark navy, gold accent, QR)
 *
 * No image API required. All rendering is pure CSS + inline SVG.
 */
import React from "react";

export type CardDesign = "scifi" | "federal" | "military" | "corporate";
export interface CardAward { emoji: string; label: string; }

export interface CssIdCardProps {
  name: string;
  callsign?: string | null;
  jobTitle: string;
  xp?: number;
  design?: CardDesign;
  /** Size variant */
  size?: "small" | "medium" | "large";
  /** Click handler for lightbox */
  /** Up to 3 awards to display on the card */
  awards?: CardAward[];
  onClick?: () => void;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function accentFromName(name: string): string {
  const palette = ["#00c8a0", "#00a8e8", "#e86c00", "#c800a8", "#a8c800", "#e80050"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

/** Fake employee ID from name */
function employeeId(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return String(h % 900000 + 100000);
}

/** Fake issue date (always in the past) */
function issueDate(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 17 + name.charCodeAt(i)) >>> 0;
  const year = 2020 + (h % 4);
  const month = String((h % 12) + 1).padStart(2, "0");
  const day = String((h % 28) + 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Fake expiry (always in the future) */
function expiryDate(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 23 + name.charCodeAt(i)) >>> 0;
  const year = 2027 + (h % 4);
  const month = String((h % 12) + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Simple QR-like pattern using deterministic squares */
function MiniQr({ seed, size = 40, fg = "#000", bg = "#fff" }: { seed: string; size?: number; fg?: string; bg?: string }) {
  const cells = 7;
  const cell = size / cells;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bits: boolean[] = [];
  for (let i = 0; i < cells * cells; i++) {
    bits.push(((h >> (i % 32)) & 1) === 1);
    if (i % 32 === 31) h = (h * 1664525 + 1013904223) >>> 0;
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill={bg} />
      {bits.map((on, i) => on ? (
        <rect key={i} x={(i % cells) * cell} y={Math.floor(i / cells) * cell} width={cell} height={cell} fill={fg} />
      ) : null)}
      {/* Corner finder patterns */}
      {[[0,0],[0,4],[4,0]].map(([cx,cy], i) => (
        <g key={i}>
          <rect x={cx*cell} y={cy*cell} width={3*cell} height={3*cell} fill={fg} />
          <rect x={cx*cell+cell*0.5} y={cy*cell+cell*0.5} width={2*cell} height={2*cell} fill={bg} />
          <rect x={cx*cell+cell} y={cy*cell+cell} width={cell} height={cell} fill={fg} />
        </g>
      ))}
    </svg>
  );
}

/** Photo placeholder with initials */
function PhotoBox({ initials: init, accent, width, height, bg = "#e8eef2" }: {
  initials: string; accent: string; width: number; height: number; bg?: string;
}) {
  return (
    <div style={{
      width, height, background: bg, border: `1px solid #ccc`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, position: "relative", overflow: "hidden",
    }}>
      {/* Subtle silhouette */}
      <svg width={width} height={height} viewBox="0 0 100 130" style={{ position: "absolute", inset: 0 }}>
        <ellipse cx="50" cy="38" rx="22" ry="24" fill={`${accent}44`} />
        <ellipse cx="50" cy="105" rx="38" ry="32" fill={`${accent}33`} />
      </svg>
      <span style={{
        position: "relative", zIndex: 1,
        fontSize: Math.floor(width * 0.28),
        fontWeight: 700,
        color: accent,
        fontFamily: "Arial, sans-serif",
        letterSpacing: "0.05em",
      }}>{init}</span>
    </div>
  );
}


// ─── Awards row helper ─────────────────────────────────────────────────────────
function AwardsRow({ awards, f, dark = false }: { awards?: CardAward[]; f: (n: number) => number; dark?: boolean }) {
  if (!awards || awards.length === 0) return null;
  const list = awards.slice(0, 3);
  return (
    <div style={{
      display: "flex", gap: f(4), alignItems: "center",
      marginTop: f(4), flexWrap: "wrap",
    }}>
      {list.map((a, i) => (
        <div key={i} title={a.label} style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: f(1), minWidth: f(24),
        }}>
          <div style={{
            width: f(22), height: f(22), borderRadius: "50%",
            background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)",
            border: dark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: f(11),
          }}>{a.emoji}</div>
          <span style={{
            fontSize: f(5.5), color: dark ? "rgba(255,255,255,0.5)" : "#666",
            textAlign: "center", letterSpacing: "0.03em",
            maxWidth: f(28), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{a.label}</span>
        </div>
      ))}
    </div>
  );
}
// ─── Design 1: US Federal PIV badge ───────────────────────────────────────────

function FederalCard({ name, callsign, jobTitle, xp, size, onClick, awards }: CssIdCardProps & { size: "small"|"medium"|"large" }) {
  const scale = size === "small" ? 0.55 : size === "medium" ? 0.8 : 1.2;
  const W = Math.round(242 * scale);
  const H = Math.round(384 * scale);
  const accent = accentFromName(name);
  const init = initials(name);
  const eid = employeeId(name);
  const expiry = expiryDate(name);
  const issued = issueDate(name);
  const f = (n: number) => Math.round(n * scale);

  return (
    <div onClick={onClick} style={{
      width: W, height: H, background: "#f8f9fa",
      border: "1.5px solid #bbb",
      borderRadius: f(8),
      overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      fontFamily: "Arial, Helvetica, sans-serif",
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      display: "flex", flexDirection: "column",
      userSelect: "none", flexShrink: 0,
    }}>
      {/* Header bar */}
      <div style={{
        background: "#1a3a6e",
        padding: `${f(5)}px ${f(8)}px`,
        display: "flex", alignItems: "center", gap: f(6),
      }}>
        {/* Eagle seal placeholder */}
        <svg width={f(28)} height={f(28)} viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="13" fill="none" stroke="#c8a84b" strokeWidth="1.5" />
          <text x="14" y="19" textAnchor="middle" fontSize="14" fill="#c8a84b">★</text>
        </svg>
        <div>
          <div style={{ color: "#fff", fontSize: f(7), fontWeight: 700, letterSpacing: "0.04em" }}>
            FACILITY 404
          </div>
          <div style={{ color: "#a8c4e8", fontSize: f(6), letterSpacing: "0.03em" }}>
            PERSONNEL IDENTIFICATION
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: `${f(8)}px ${f(8)}px ${f(4)}px`, display: "flex", gap: f(8) }}>
        {/* Photo */}
        <div style={{ display: "flex", flexDirection: "column", gap: f(4), alignItems: "center" }}>
          <PhotoBox initials={init} accent={accent} width={f(72)} height={f(88)} bg="#dce8f0" />
          {/* Chip */}
          <div style={{
            width: f(38), height: f(28),
            background: "linear-gradient(135deg, #c8a84b 0%, #e8d080 40%, #c8a84b 100%)",
            borderRadius: f(3), border: "1px solid #a88830",
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr 1fr",
            gap: "1px", padding: "2px",
          }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ background: "#b87820", borderRadius: "1px" }} />
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: f(5) }}>
          <div>
            <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</div>
            <div style={{ fontSize: f(9), fontWeight: 700, color: "#111", lineHeight: 1.2 }}>
              {name.split(" ").reverse().join(", ")}
            </div>
          </div>
          <div>
            <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Position</div>
            <div style={{ fontSize: f(8), color: "#222", lineHeight: 1.2 }}>{jobTitle}</div>
          </div>
          {callsign && (
            <div>
              <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Callsign</div>
              <div style={{ fontSize: f(8), color: accent, fontWeight: 700 }}>{callsign}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: f(8) }}>
            <div>
              <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>ID</div>
              <div style={{ fontSize: f(7), fontFamily: "monospace", color: "#333" }}>{eid}</div>
            </div>
            <div>
              <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Issued</div>
              <div style={{ fontSize: f(7), fontFamily: "monospace", color: "#333" }}>{issued}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expires</div>
            <div style={{ fontSize: f(8), fontFamily: "monospace", color: "#c00", fontWeight: 700 }}>{expiry}</div>
          </div>
          {xp !== undefined && (
            <div>
              <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Clearance XP</div>
              <div style={{ height: f(5), background: "#ddd", borderRadius: f(2), marginTop: f(2) }}>
                <div style={{ height: "100%", width: `${Math.min(100, (xp % 10) * 10)}%`, background: accent, borderRadius: f(2) }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <AwardsRow awards={awards} f={f} dark={false} />
      {/* Colour stripe at bottom — category indicator */}
      <div style={{
        height: f(20),
        background: `linear-gradient(90deg, ${accent} 0%, ${accent}cc 60%, #1a3a6e 100%)`,
        display: "flex", alignItems: "center", padding: `0 ${f(8)}px`,
        justifyContent: "space-between",
      }}>
        <span style={{ color: "#fff", fontSize: f(7), fontWeight: 700, letterSpacing: "0.08em" }}>
          AUTHORIZED PERSONNEL
        </span>
        <span style={{ color: "#ffffffaa", fontSize: f(6), fontFamily: "monospace" }}>
          F404-{eid.slice(-4)}
        </span>
      </div>

      {/* Barcode strip */}
      <div style={{
        height: f(14),
        background: "repeating-linear-gradient(90deg, #111 0px, #111 2px, #fff 2px, #fff 4px, #333 4px, #333 5px, #fff 5px, #fff 8px)",
      }} />
    </div>
  );
}

// ─── Design 2: Military CAC-style ─────────────────────────────────────────────

function MilitaryCard({ name, callsign, jobTitle, xp, size, onClick, awards }: CssIdCardProps & { size: "small"|"medium"|"large" }) {
  const scale = size === "small" ? 0.55 : size === "medium" ? 0.8 : 1.2;
  // CAC is landscape: 85.6mm × 54mm → ~3.37:1 ratio
  const W = Math.round(340 * scale);
  const H = Math.round(215 * scale);
  const accent = accentFromName(name);
  const init = initials(name);
  const eid = employeeId(name);
  const expiry = expiryDate(name);
  const f = (n: number) => Math.round(n * scale);

  // Branch colour from name hash
  const branches = [
    { name: "ARMY", color: "#4a6741", seal: "★" },
    { name: "NAVY", color: "#1a2e5a", seal: "⚓" },
    { name: "AIR FORCE", color: "#1a4a8a", seal: "✈" },
    { name: "MARINES", color: "#8b1a1a", seal: "⚔" },
    { name: "COAST GUARD", color: "#1a5a4a", seal: "⚓" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const branch = branches[h % branches.length];

  return (
    <div onClick={onClick} style={{
      width: W, height: H, background: "#f0f2f5",
      border: `2px solid ${branch.color}`,
      borderRadius: f(6),
      overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      fontFamily: "Arial, Helvetica, sans-serif",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      display: "flex", flexDirection: "column",
      userSelect: "none", flexShrink: 0,
    }}>
      {/* Top header */}
      <div style={{
        background: branch.color,
        padding: `${f(4)}px ${f(8)}px`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: f(6) }}>
          <div style={{
            width: f(22), height: f(22), borderRadius: "50%",
            border: `1.5px solid #c8a84b`,
            background: `${branch.color}cc`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: f(12), color: "#c8a84b",
          }}>{branch.seal}</div>
          <div>
            <div style={{ color: "#fff", fontSize: f(7), fontWeight: 700, letterSpacing: "0.06em" }}>
              FACILITY 404 — {branch.name}
            </div>
            <div style={{ color: "#c8a84b", fontSize: f(6), letterSpacing: "0.04em" }}>
              COMMON ACCESS CARD
            </div>
          </div>
        </div>
        <div style={{ color: "#ffffffaa", fontSize: f(6), fontFamily: "monospace", textAlign: "right" }}>
          <div>ID: {eid}</div>
          <div>EXP: {expiry}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", gap: 0 }}>
        {/* Photo strip */}
        <div style={{
          background: "#dce8f0",
          borderRight: `2px solid ${branch.color}44`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: `${f(6)}px ${f(6)}px`,
          gap: f(4),
        }}>
          <PhotoBox initials={init} accent={accent} width={f(62)} height={f(78)} bg="#dce8f0" />
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: `${f(6)}px ${f(8)}px`, display: "flex", flexDirection: "column", gap: f(4) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</div>
              <div style={{ fontSize: f(10), fontWeight: 700, color: "#111", lineHeight: 1.1 }}>
                {name.toUpperCase()}
              </div>
            </div>
            <MiniQr seed={name + eid} size={f(38)} fg={branch.color} bg="#f0f2f5" />
          </div>

          <div style={{ display: "flex", gap: f(12) }}>
            <div>
              <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>Rank/Grade</div>
              <div style={{ fontSize: f(8), fontWeight: 700, color: branch.color }}>
                {callsign ?? "CIVILIAN"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>Position</div>
              <div style={{ fontSize: f(7), color: "#333" }}>{jobTitle}</div>
            </div>
          </div>

          {xp !== undefined && (
            <div>
              <div style={{ fontSize: f(6), color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Service XP
              </div>
              <div style={{ height: f(4), background: "#ddd", borderRadius: f(2), marginTop: f(2) }}>
                <div style={{ height: "100%", width: `${Math.min(100, (xp % 10) * 10)}%`, background: branch.color, borderRadius: f(2) }} />
              </div>
            </div>
          )}

          <AwardsRow awards={awards} f={f} dark={false} />
          <div style={{ fontSize: f(6), color: "#888", marginTop: "auto", lineHeight: 1.4 }}>
            This card is the property of Facility 404.<br />
            Geneva Conventions Identification Card.
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{
        height: f(12),
        background: `repeating-linear-gradient(90deg, ${branch.color} 0px, ${branch.color} 3px, #f0f2f5 3px, #f0f2f5 5px)`,
      }} />
    </div>
  );
}

// ─── Design 3: Corporate Security Access ──────────────────────────────────────

function CorporateCard({ name, callsign, jobTitle, xp, size, onClick, awards }: CssIdCardProps & { size: "small"|"medium"|"large" }) {
  const scale = size === "small" ? 0.55 : size === "medium" ? 0.8 : 1.2;
  const W = Math.round(242 * scale);
  const H = Math.round(384 * scale);
  const accent = accentFromName(name);
  const init = initials(name);
  const eid = employeeId(name);
  const f = (n: number) => Math.round(n * scale);

  return (
    <div onClick={onClick} style={{
      width: W, height: H,
      background: "linear-gradient(160deg, #0d1b2e 0%, #0a1520 60%, #0d1b2e 100%)",
      border: "1.5px solid #1e3a5a",
      borderRadius: f(10),
      overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      fontFamily: "Arial, Helvetica, sans-serif",
      boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${accent}22`,
      display: "flex", flexDirection: "column",
      userSelect: "none", flexShrink: 0,
    }}>
      {/* Gold accent top stripe */}
      <div style={{ height: f(5), background: `linear-gradient(90deg, ${accent}, #c8a84b, ${accent})` }} />

      {/* Header */}
      <div style={{
        padding: `${f(8)}px ${f(10)}px ${f(6)}px`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid #1e3a5a`,
      }}>
        {/* Shield icon */}
        <div style={{ display: "flex", alignItems: "center", gap: f(6) }}>
          <svg width={f(24)} height={f(28)} viewBox="0 0 24 28">
            <path d="M12 1 L22 5 L22 14 Q22 22 12 27 Q2 22 2 14 L2 5 Z" fill={accent} opacity="0.9" />
            <path d="M12 5 L18 8 L18 14 Q18 19 12 23 Q6 19 6 14 L6 8 Z" fill="none" stroke="#fff" strokeWidth="1" />
            <text x="12" y="17" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">F4</text>
          </svg>
          <div>
            <div style={{ color: "#fff", fontSize: f(8), fontWeight: 700, letterSpacing: "0.05em" }}>FACILITY 404</div>
            <div style={{ color: accent, fontSize: f(6), letterSpacing: "0.08em" }}>SECURITY ACCESS</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#ffffff44", fontSize: f(6), fontFamily: "monospace" }}>ID</div>
          <div style={{ color: "#ffffffaa", fontSize: f(7), fontFamily: "monospace" }}>{eid}</div>
        </div>
      </div>

      {/* Photo area */}
      <div style={{
        padding: `${f(10)}px ${f(10)}px ${f(6)}px`,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{
          border: `2px solid ${accent}66`,
          borderRadius: f(4),
          overflow: "hidden",
          boxShadow: `0 0 12px ${accent}33`,
        }}>
          <PhotoBox initials={init} accent={accent} width={f(100)} height={f(120)} bg="#0a1a2e" />
        </div>
      </div>

      {/* Name / title */}
      <div style={{ padding: `0 ${f(10)}px ${f(8)}px`, textAlign: "center" }}>
        <div style={{
          fontSize: f(13), fontWeight: 700, color: "#fff",
          letterSpacing: "0.06em", textTransform: "uppercase",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{name}</div>
        {callsign && (
          <div style={{ fontSize: f(8), color: accent, letterSpacing: "0.1em", marginTop: f(2) }}>
            ◈ {callsign}
          </div>
        )}
        <div style={{ fontSize: f(8), color: "#8aada4", marginTop: f(3), letterSpacing: "0.04em" }}>
          {jobTitle}
        </div>
      </div>

      {/* QR + access level */}
      <div style={{
        flex: 1,
        padding: `${f(4)}px ${f(10)}px`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: `1px solid #1e3a5a`,
      }}>
        <div>
          <div style={{ fontSize: f(6), color: "#ffffff44", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: f(3) }}>
            Access Level
          </div>
          <div style={{ display: "flex", gap: f(3) }}>
            {[1,2,3,4,5].map((lvl) => {
              const filled = lvl <= (xp !== undefined ? Math.min(5, Math.floor(xp / 2) + 1) : 3);
              return (
                <div key={lvl} style={{
                  width: f(10), height: f(10), borderRadius: f(2),
                  background: filled ? accent : "#1e3a5a",
                  border: `1px solid ${filled ? accent : "#2a4a6a"}`,
                }} />
              );
            })}
          </div>
          {xp !== undefined && (
            <div style={{ fontSize: f(6), color: "#ffffff44", marginTop: f(3) }}>
              XP: {xp}
            </div>
          )}
        </div>
        <MiniQr seed={name + eid} size={f(48)} fg={accent} bg="#0a1520" />
      </div>

      <AwardsRow awards={awards} f={f} dark={true} />
      {/* Bottom gold stripe */}
      <div style={{
        height: f(8),
        background: `linear-gradient(90deg, transparent, ${accent}88, #c8a84b, ${accent}88, transparent)`,
      }} />
    </div>
  );
}

// ─── Design 4: Original Sci-Fi (kept for backward compat) ─────────────────────

function SciFiCard({ name, callsign, jobTitle, xp, size, onClick, awards }: CssIdCardProps & { size: "small"|"medium"|"large" }) {
  const scale = size === "small" ? 0.55 : size === "medium" ? 0.8 : 1.2;
  const W = Math.round(242 * scale);
  const H = Math.round(330 * scale);
  const accent = accentFromName(name);
  const init = initials(name);
  const f = (n: number) => Math.round(n * scale);

  return (
    <div onClick={onClick} style={{
      width: W, height: H, borderRadius: f(10),
      border: `2px solid ${accent}44`,
      background: "linear-gradient(160deg, #0d1a1f 0%, #0a1215 60%, #0d1a1f 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      fontFamily: "var(--font-mono, 'Courier New', monospace)",
      boxShadow: `0 0 18px ${accent}22, inset 0 0 30px rgba(0,0,0,0.4)`,
      userSelect: "none", flexShrink: 0,
    }}>
      <div style={{ height: f(6), background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)` }} />
      <div style={{
        padding: `${f(6)}px ${f(10)}px ${f(4)}px`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${accent}33`,
      }}>
        <span style={{ fontSize: f(9), color: accent, letterSpacing: "0.12em", fontWeight: 700 }}>FACILITY 404</span>
        <span style={{ fontSize: f(8), color: "#ffffff44", letterSpacing: "0.08em" }}>PERSONNEL</span>
      </div>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
        background: `radial-gradient(ellipse at 50% 40%, ${accent}18 0%, transparent 70%)`,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
          pointerEvents: "none",
        }} />
        {[
          { top: f(8), left: f(8), borderTop: `2px solid ${accent}88`, borderLeft: `2px solid ${accent}88` },
          { top: f(8), right: f(8), borderTop: `2px solid ${accent}88`, borderRight: `2px solid ${accent}88` },
          { bottom: f(8), left: f(8), borderBottom: `2px solid ${accent}88`, borderLeft: `2px solid ${accent}88` },
          { bottom: f(8), right: f(8), borderBottom: `2px solid ${accent}88`, borderRight: `2px solid ${accent}88` },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: f(14), height: f(14), ...s }} />
        ))}
        <div style={{
          width: f(80), height: f(80), borderRadius: "50%",
          border: `2px solid ${accent}66`,
          background: `radial-gradient(circle at 40% 35%, ${accent}22, #0a1215 70%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: f(26), fontWeight: 700, color: accent,
          textShadow: `0 0 12px ${accent}`, position: "relative", zIndex: 1,
        }}>{init}</div>
      </div>
      <div style={{
        background: "linear-gradient(180deg, #0a1215 0%, #060e11 100%)",
        borderTop: `1px solid ${accent}44`,
        padding: `${f(8)}px ${f(10)}px ${f(10)}px`,
      }}>
        <div style={{ fontSize: f(10), fontWeight: 700, color: "#e8f4f0", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        {callsign && <div style={{ fontSize: f(9), color: accent, letterSpacing: "0.1em", marginTop: f(2) }}>◈ {callsign}</div>}
        <div style={{ fontSize: f(8), color: "#8aada4", letterSpacing: "0.04em", marginTop: callsign ? f(2) : f(4), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{jobTitle}</div>
        {xp !== undefined && (
          <div style={{ marginTop: f(6), display: "flex", alignItems: "center", gap: f(6) }}>
            <span style={{ fontSize: f(8), color: "#ffffff44", letterSpacing: "0.06em" }}>XP</span>
            <div style={{ flex: 1, height: f(3), background: "#ffffff11", borderRadius: f(2) }}>
              <div style={{ height: "100%", width: `${Math.min(100, (xp % 10) * 10)}%`, background: accent, borderRadius: f(2) }} />
            </div>
            <span style={{ fontSize: f(8), color: accent }}>{xp}</span>
          </div>
        )}
      </div>
      <AwardsRow awards={awards} f={f} dark={true} />
      <div style={{
        height: f(10),
        background: `repeating-linear-gradient(90deg, ${accent}33 0px, ${accent}33 2px, transparent 2px, transparent 4px, ${accent}55 4px, ${accent}55 5px, transparent 5px, transparent 8px)`,
        borderTop: `1px solid ${accent}22`,
      }} />
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function CssIdCard(props: CssIdCardProps) {
  const { design = "scifi", size = "medium", ...rest } = props;
  switch (design) {
    case "federal":   return <FederalCard    {...rest} size={size} />;
    case "military":  return <MilitaryCard   {...rest} size={size} />;
    case "corporate": return <CorporateCard  {...rest} size={size} />;
    default:          return <SciFiCard      {...rest} size={size} />;
  }
}

export const CARD_DESIGNS: { value: CardDesign; label: string; description: string }[] = [
  { value: "scifi",     label: "Facility 404",   description: "Dark teal institutional badge" },
  { value: "federal",   label: "Federal PIV",    description: "US government employee badge" },
  { value: "military",  label: "Military CAC",   description: "DoD Common Access Card" },
  { value: "corporate", label: "Corporate",      description: "Security access card" },
];
