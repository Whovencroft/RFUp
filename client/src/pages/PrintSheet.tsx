import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2 } from "lucide-react";

// Dice pip layouts for D6 faces (positions as [row, col] on a 3x3 grid)
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DieFace({ value }: { value: number }) {
  const pips = PIP_LAYOUTS[value] ?? [];
  return (
    <div
      style={{
        width: 28,
        height: 28,
        border: "1.5px solid #333",
        borderRadius: 4,
        position: "relative",
        display: "inline-block",
        background: "#fff",
      }}
    >
      {Array.from({ length: 3 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => {
          const active = pips.some(([r, c]) => r === row && c === col);
          return (
            <div
              key={`${row}-${col}`}
              style={{
                position: "absolute",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: active ? "#111" : "transparent",
                top: `${row * 33 + 16}%`,
                left: `${col * 33 + 16}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          );
        })
      )}
    </div>
  );
}

export default function PrintSheet() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: character, isLoading: charLoading } = trpc.character.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading || charLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Sign in to view your character sheet.</p>
          <a href={getLoginUrl()} className="underline text-primary text-sm">Sign in</a>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No character found.</p>
          <p className="text-sm text-muted-foreground">Create your character on the Play page first.</p>
        </div>
      </div>
    );
  }

  const skills = character.skills ?? [];
  // Pad skills to at least 8 rows for blank lines
  const skillRows = [...skills];
  while (skillRows.length < 8) {
    skillRows.push(null as any);
  }

  return (
    <>
      {/* Print-specific global styles injected inline */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
        @page {
          size: letter portrait;
          margin: 0.6in 0.7in;
        }
        body { font-family: 'Georgia', serif; }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          style={{
            background: "#0d9488",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 18px",
            fontFamily: "monospace",
            fontSize: 13,
            cursor: "pointer",
            letterSpacing: "0.08em",
          }}
        >
          PRINT / SAVE PDF
        </button>
        <button
          onClick={() => window.history.back()}
          style={{
            background: "transparent",
            color: "#888",
            border: "1px solid #444",
            borderRadius: 6,
            padding: "8px 14px",
            fontFamily: "monospace",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>

      {/* The printable sheet */}
      <div
        className="print-page"
        style={{
          maxWidth: 680,
          margin: "40px auto",
          padding: "40px 48px",
          background: "#fff",
          color: "#111",
          fontFamily: "Georgia, serif",
          boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
          borderRadius: 4,
          minHeight: "10.5in",
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: "2.5px solid #111", paddingBottom: 14, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", color: "#555", marginBottom: 4 }}>
                FACILITY 404 — OPERATOR DOSSIER
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Roll for Uptime
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#888", letterSpacing: "0.1em" }}>CLEARANCE LEVEL</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "#111" }}>
                {skills.length > 0 ? skills.reduce((max, s) => Math.max(max, s.level), 0) : 1}
              </div>
            </div>
          </div>
        </div>

        {/* Identity Block */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 8.5, letterSpacing: "0.15em", color: "#888", marginBottom: 3 }}>OPERATOR NAME</div>
            <div style={{ fontSize: 20, fontWeight: 700, borderBottom: "1px solid #ccc", paddingBottom: 4 }}>
              {character.name}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 8.5, letterSpacing: "0.15em", color: "#888", marginBottom: 3 }}>DESIGNATION / JOB TITLE</div>
            <div style={{ fontSize: 16, fontWeight: 400, borderBottom: "1px solid #ccc", paddingBottom: 4, fontStyle: "italic" }}>
              {character.jobTitle}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 8.5, letterSpacing: "0.15em", color: "#888", marginBottom: 3 }}>EXPERIENCE POINTS (XP)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #ccc", paddingBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>{character.xp}</span>
              <span style={{ fontSize: 11, color: "#888" }}>available</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 8.5, letterSpacing: "0.15em", color: "#888", marginBottom: 3 }}>TOTAL SKILLS</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", borderBottom: "1px solid #ccc", paddingBottom: 4 }}>
              {skills.length}
            </div>
          </div>
        </div>

        {/* Skill Manifest */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", color: "#555", marginBottom: 10, borderBottom: "1px solid #ddd", paddingBottom: 6 }}>
            SKILL MANIFEST
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", fontFamily: "monospace", fontSize: 8, letterSpacing: "0.12em", color: "#888", fontWeight: 400, paddingBottom: 6, borderBottom: "1px solid #eee", width: "55%" }}>SKILL NAME</th>
                <th style={{ textAlign: "center", fontFamily: "monospace", fontSize: 8, letterSpacing: "0.12em", color: "#888", fontWeight: 400, paddingBottom: 6, borderBottom: "1px solid #eee", width: "15%" }}>LEVEL</th>
                <th style={{ textAlign: "center", fontFamily: "monospace", fontSize: 8, letterSpacing: "0.12em", color: "#888", fontWeight: 400, paddingBottom: 6, borderBottom: "1px solid #eee", width: "30%" }}>DICE POOL</th>
              </tr>
            </thead>
            <tbody>
              {skillRows.map((skill, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 4px 8px 0", fontWeight: skill ? 600 : 400 }}>
                    {skill ? `${skill.name} ${skill.level}` : <span style={{ color: "#ddd" }}>——</span>}
                  </td>
                  <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>
                    {skill ? skill.level : ""}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {skill ? (
                      <div style={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
                        {Array.from({ length: skill.level }).map((_, di) => (
                          <DieFace key={di} value={6} />
                        ))}
                      </div>
                    ) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* XP Tracker */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", color: "#555", marginBottom: 10, borderBottom: "1px solid #ddd", paddingBottom: 6 }}>
            XP TRACKER
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "1.5px solid #bbb",
                  background: i < character.xp ? "#0d9488" : "#fff",
                  display: "inline-block",
                }}
              />
            ))}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#aaa", marginTop: 6 }}>
            Earn 1 XP on a failed roll. Spend 1 XP to convert one die to a 6 during an advancement roll.
          </div>
        </div>

        {/* Rules Reference */}
        <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 4, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", color: "#555", marginBottom: 10 }}>
            CORE RULES — QUICK REFERENCE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", fontSize: 11, lineHeight: 1.55 }}>
            <div>
              <strong>Roll dice equal to your skill level.</strong> If any die beats the GM's opposing roll, you succeed.
            </div>
            <div>
              <strong>All dice show 6?</strong> You succeed and gain a new, more specific skill at level 1.
            </div>
            <div>
              <strong>Fail a roll?</strong> Gain 1 XP. Spend XP to convert a die to 6 on your next advancement roll.
            </div>
            <div>
              <strong>Starting skill:</strong> Do Anything 1. Every operator begins with one die.
            </div>
            <div>
              <strong>Skill naming:</strong> New skills must be more specific than the skill used to earn them.
            </div>
            <div>
              <strong>DC ratings:</strong> 1–5 routine, 6–8 elevated, 9–10 critical, 11–12 facility-threatening.
            </div>
          </div>
        </div>

        {/* Notes area */}
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", color: "#555", marginBottom: 8, borderBottom: "1px solid #ddd", paddingBottom: 6 }}>
            INCIDENT NOTES / SESSION LOG
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ borderBottom: "1px solid #e8e8e8", height: 26, marginBottom: 2 }} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, borderTop: "1px solid #ddd", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: "#bbb", letterSpacing: "0.1em" }}>
            FACILITY 404 — ROLL FOR UPTIME — OPERATOR DOSSIER
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: "#bbb" }}>
            SLA: 99.999% — UPTIME CRITICAL
          </div>
        </div>
      </div>
    </>
  );
}
