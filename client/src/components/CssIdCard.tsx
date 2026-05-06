/**
 * CssIdCard — a pure CSS/HTML ID card portrait.
 * No image API required. Renders an institutional badge with the operator's
 * name, callsign, job title, XP, and a stylised silhouette placeholder.
 */
import React from "react";

interface CssIdCardProps {
  name: string;
  callsign?: string | null;
  jobTitle: string;
  xp?: number;
  /** Size variant */
  size?: "small" | "medium" | "large";
  /** Click handler for lightbox */
  onClick?: () => void;
}

const SIZES = {
  small:  { width: 160, height: 210, font: 10, titleFont: 8, mono: 9 },
  medium: { width: 240, height: 315, font: 13, titleFont: 11, mono: 11 },
  large:  { width: 360, height: 472, font: 17, titleFont: 14, mono: 14 },
};

/** Deterministic "hash" colour from a string — picks from a palette */
function accentFromName(name: string): string {
  const palette = ["#00c8a0", "#00a8e8", "#e86c00", "#c800a8", "#a8c800", "#e80050"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

/** Initials from name (up to 2 chars) */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function CssIdCard({ name, callsign, jobTitle, xp, size = "medium", onClick }: CssIdCardProps) {
  const s = SIZES[size];
  const accent = accentFromName(name);
  const init = initials(name);
  const cardId = `card-${name.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      id={cardId}
      onClick={onClick}
      style={{
        width: s.width,
        height: s.height,
        borderRadius: 10,
        border: `2px solid ${accent}44`,
        background: "linear-gradient(160deg, #0d1a1f 0%, #0a1215 60%, #0d1a1f 100%)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        fontFamily: "var(--font-mono, 'Courier New', monospace)",
        boxShadow: `0 0 18px ${accent}22, inset 0 0 30px rgba(0,0,0,0.4)`,
        position: "relative",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* Top stripe */}
      <div style={{
        height: 6,
        background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)`,
      }} />

      {/* Header bar */}
      <div style={{
        padding: "6px 10px 4px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${accent}33`,
      }}>
        <span style={{ fontSize: s.mono - 1, color: accent, letterSpacing: "0.12em", fontWeight: 700 }}>
          FACILITY 404
        </span>
        <span style={{ fontSize: s.mono - 2, color: "#ffffff44", letterSpacing: "0.08em" }}>
          PERSONNEL
        </span>
      </div>

      {/* Photo area — stylised silhouette */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(ellipse at 50% 40%, ${accent}18 0%, transparent 70%)`,
      }}>
        {/* Scan-line overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
          pointerEvents: "none",
        }} />

        {/* Initials circle */}
        <div style={{
          width: s.width * 0.42,
          height: s.width * 0.42,
          borderRadius: "50%",
          border: `2px solid ${accent}66`,
          background: `radial-gradient(circle at 40% 35%, ${accent}22, #0a1215 70%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: s.width * 0.14,
          fontWeight: 700,
          color: accent,
          letterSpacing: "0.05em",
          textShadow: `0 0 12px ${accent}`,
          position: "relative",
          zIndex: 1,
        }}>
          {init}
        </div>

        {/* Corner brackets */}
        {[
          { top: 8, left: 8, borderTop: `2px solid ${accent}88`, borderLeft: `2px solid ${accent}88` },
          { top: 8, right: 8, borderTop: `2px solid ${accent}88`, borderRight: `2px solid ${accent}88` },
          { bottom: 8, left: 8, borderBottom: `2px solid ${accent}88`, borderLeft: `2px solid ${accent}88` },
          { bottom: 8, right: 8, borderBottom: `2px solid ${accent}88`, borderRight: `2px solid ${accent}88` },
        ].map((style, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 14, height: 14,
            ...style,
          }} />
        ))}
      </div>

      {/* Footer — name / callsign / title */}
      <div style={{
        background: `linear-gradient(180deg, #0a1215 0%, #060e11 100%)`,
        borderTop: `1px solid ${accent}44`,
        padding: "8px 10px 10px",
      }}>
        {/* Name row */}
        <div style={{
          fontSize: s.font,
          fontWeight: 700,
          color: "#e8f4f0",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textTransform: "uppercase",
        }}>
          {name}
        </div>

        {/* Callsign */}
        {callsign && (
          <div style={{
            fontSize: s.mono - 1,
            color: accent,
            letterSpacing: "0.1em",
            marginTop: 2,
          }}>
            ◈ {callsign}
          </div>
        )}

        {/* Job title */}
        <div style={{
          fontSize: s.titleFont,
          color: "#8aada4",
          letterSpacing: "0.04em",
          marginTop: callsign ? 2 : 4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {jobTitle}
        </div>

        {/* XP bar */}
        {xp !== undefined && (
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: s.mono - 2, color: "#ffffff44", letterSpacing: "0.06em" }}>XP</span>
            <div style={{ flex: 1, height: 3, background: "#ffffff11", borderRadius: 2 }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, (xp % 10) * 10)}%`,
                background: accent,
                borderRadius: 2,
                transition: "width 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: s.mono - 2, color: accent, letterSpacing: "0.04em" }}>{xp}</span>
          </div>
        )}
      </div>

      {/* Bottom barcode strip */}
      <div style={{
        height: 10,
        background: `repeating-linear-gradient(90deg, ${accent}33 0px, ${accent}33 2px, transparent 2px, transparent 4px, ${accent}55 4px, ${accent}55 5px, transparent 5px, transparent 8px)`,
        borderTop: `1px solid ${accent}22`,
      }} />
    </div>
  );
}
