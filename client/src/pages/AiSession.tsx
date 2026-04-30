import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bot,
  User,
  ChevronLeft,
  Dices,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Printer,
  Star,
} from "lucide-react";

// ── Die Face ─────────────────────────────────────────────────────────────────

function DieFace({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const dots: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };
  const isSix = value === 6;
  const dim = size === "sm" ? "w-7 h-7" : "w-10 h-10";
  const svgDim = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  return (
    <div
      className={`relative ${dim} rounded-md border-2 flex items-center justify-center shrink-0 ${
        isSix
          ? "border-primary bg-primary/20"
          : "border-border bg-card"
      }`}
    >
      <svg viewBox="0 0 100 100" className={svgDim}>
        {(dots[value] ?? []).map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={10}
            fill={isSix ? "oklch(0.72 0.12 165)" : "currentColor"}
            className={isSix ? "" : "text-foreground"}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Animated Rolling Die ──────────────────────────────────────────────────────

function RollingDie({ finalValue, delay }: { finalValue: number; delay: number }) {
  const [display, setDisplay] = useState(1);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setDisplay(1);
    setSettled(false);
    let count = 0;
    const total = 8;
    const interval = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= total) {
        clearInterval(interval);
        setTimeout(() => {
          setDisplay(finalValue);
          setSettled(true);
        }, delay);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [finalValue, delay]);

  return (
    <div className={`transition-transform duration-200 ${settled ? "scale-110" : "scale-100"}`}>
      <DieFace value={display} />
    </div>
  );
}

// ── Ruling Badge ──────────────────────────────────────────────────────────────

function RulingBadge({ ruling }: { ruling: string | null | undefined }) {
  if (!ruling) return null;
  if (ruling === "approved")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-2 py-0.5">
        <CheckCircle className="w-3 h-3" /> SKILL APPROVED
      </span>
    );
  if (ruling === "denied")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono text-red-400 bg-red-400/10 border border-red-400/20 rounded px-2 py-0.5">
        <XCircle className="w-3 h-3" /> SKILL DENIED
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5">
      <AlertTriangle className="w-3 h-3" /> PARTIAL RULING
    </span>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBadge({ step }: { step: 1 | 2 | 3 }) {
  const labels = { 1: "DESCRIBE ACTION", 2: "SELECT SKILL & ROLL", 3: "SUBMITTING…" };
  return (
    <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5">
      STEP {step}: {labels[step]}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AiSession() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const { user } = useAuth();
  const feedRef = useRef<HTMLDivElement>(null);

  // Three-step flow state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [actionText, setActionText] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; level: number } | null>(null);
  const [rolledDice, setRolledDice] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const { data: session, refetch: refetchSession } = trpc.aiGm.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: 5000 }
  );

  const { data: messages, refetch: refetchMessages } = trpc.aiGm.getMessages.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: 5000 }
  );

  const { data: myChar } = trpc.character.get.useQuery();

  // Build allies list from session player order (everyone except self)
  const playerOrder: number[] = JSON.parse(session?.playerOrder || "[]");
  const { data: allChars } = trpc.character.listAll.useQuery(
    undefined,
    { enabled: playerOrder.length > 1 }
  );
  const allies = allChars?.filter(
    (c) => c.userId !== user?.id && playerOrder.includes(c.userId)
  ) ?? [];

  const submitAction = trpc.aiGm.submitAction.useMutation({
    onSuccess: () => {
      setActionText("");
      setSelectedSkill(null);
      setRolledDice([]);
      setStep(1);
      refetchMessages();
      refetchSession();
      toast.success("Action submitted.");
    },
    onError: (e) => {
      toast.error(e.message);
      setStep(2);
    },
  });

  // Auto-scroll feed to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  // Roll dice for selected skill
  const rollSkill = useCallback((skill: { name: string; level: number }) => {
    setSelectedSkill(skill);
    setIsRolling(true);
    const results = Array.from({ length: skill.level }, () => Math.floor(Math.random() * 6) + 1);
    // Let animation play for ~1s before marking settled
    setTimeout(() => {
      setRolledDice(results);
      setIsRolling(false);
    }, 900);
  }, []);

  function handleSubmit() {
    if (!actionText.trim()) return toast.error("Describe your action first.");
    if (!selectedSkill) return toast.error("Select a skill to roll.");
    if (rolledDice.length === 0) return toast.error("Roll your dice first.");
    setStep(3);
    submitAction.mutate({
      sessionId,
      actionDescription: actionText.trim(),
      skillName: selectedSkill.name,
      skillLevel: selectedSkill.level,
      diceResults: rolledDice,
    });
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono text-sm">
        Loading session…
      </div>
    );
  }

  const isMyTurn = session.currentTurnUserId === user?.id;
  const isEnded = session.status === "ended";

  // Skills to show in manifest — always include Do Anything 1 as fallback
  const skills = myChar?.skills && myChar.skills.length > 0
    ? myChar.skills
    : [{ id: 0, name: "Do Anything", level: 1 }];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ── Sticky Header ── */}
      <div className="border-b border-border bg-background/95 backdrop-blur shrink-0 z-10">
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground shrink-0 h-7 px-2">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-xs font-mono">Sessions</span>
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">{session.title}</h1>
            </div>
          </div>
          <div className="shrink-0">
            {isEnded ? (
              <Badge variant="outline" className="text-muted-foreground border-border font-mono text-xs">
                SHIFT ENDED
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={`font-mono text-xs ${
                  isMyTurn
                    ? "text-primary border-primary/40 bg-primary/10"
                    : "text-amber-400 border-amber-400/40 bg-amber-400/10"
                }`}
              >
                {isMyTurn ? (
                  <><Zap className="w-3 h-3 mr-1" /> YOUR TURN</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" /> WAITING</>
                )}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-Panel Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL: Operator File ── */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden bg-background">

          {/* Operator header */}
          <div className="p-4 border-b border-border shrink-0">
            <p className="text-xs font-mono text-muted-foreground tracking-widest mb-1">OPERATOR FILE</p>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg font-serif font-bold text-foreground truncate">
                  {myChar?.name ?? "—"}
                </h2>
                <p className="text-xs text-muted-foreground truncate">{myChar?.jobTitle ?? "Unassigned"}</p>
              </div>
              <Link href="/print">
                <button className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 shrink-0" title="Print character sheet">
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
            {myChar && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5">
                  <Zap className="w-3 h-3" /> {myChar.xp ?? 0} XP
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {skills.length} skill{skills.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Skill Manifest — scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <p className="text-xs font-mono text-muted-foreground tracking-widest px-1 mb-2">SKILL MANIFEST</p>
            {skills.map((s) => {
              const isSelected = selectedSkill?.name === s.name && selectedSkill?.level === s.level;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (!isMyTurn || isEnded || step === 3) return;
                    if (step === 1 && !actionText.trim()) {
                      toast.error("Describe your action first (Step 1).");
                      return;
                    }
                    setStep(2);
                    rollSkill({ name: s.name, level: s.level });
                  }}
                  disabled={!isMyTurn || isEnded || step === 3}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all group ${
                    isSelected
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {s.name}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: s.level }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${isSelected ? "text-primary fill-primary" : "text-muted-foreground fill-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Roll {s.level}d6
                  </p>
                </button>
              );
            })}
          </div>

          {/* Allies section */}
          {allies.length > 0 && (
            <div className="border-t border-border p-3 shrink-0">
              <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2">ALLIES ON SHIFT</p>
              <div className="space-y-1.5">
                {allies.map((a) => (
                  <div key={a.userId} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-card border border-border">
                    <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground truncate font-mono">{a.jobTitle ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Incident + Chat + Input ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Active Incident Banner */}
          {session.incidentTitle && (
            <div className="shrink-0 border-b border-border bg-amber-400/5 px-4 py-2.5 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground tracking-widest">ACTIVE INCIDENT</span>
                  {session.incidentDc && (
                    <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5">
                      DC {session.incidentDc}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground mt-0.5">{session.incidentTitle}</p>
                {session.incidentDescription && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{session.incidentDescription}</p>
                )}
              </div>
            </div>
          )}

          {/* Chat Feed */}
          <div
            ref={feedRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          >
            {(!messages || messages.length === 0) && (
              <div className="text-center text-muted-foreground py-16 text-sm font-mono">
                Waiting for the shift to begin…
              </div>
            )}

            {messages?.map((msg) => {
              const isAi = msg.authorType === "ai";
              const rollData = msg.rollData ? JSON.parse(msg.rollData) : null;

              return (
                <div key={msg.id} className={`flex gap-3 ${isAi ? "" : "flex-row-reverse"}`}>
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isAi
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[78%] space-y-1.5 ${isAi ? "" : "items-end flex flex-col"}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-foreground">{msg.authorName}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.isIncidentChain && (
                        <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />NEW INCIDENT
                        </span>
                      )}
                      {msg.skillRuling && <RulingBadge ruling={msg.skillRuling} />}
                      {msg.dcSet && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted border border-border rounded px-2 py-0.5">
                          DC {msg.dcSet}
                        </span>
                      )}
                    </div>

                    {/* Roll data */}
                    {rollData && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {rollData.dice.map((d: number, i: number) => (
                          <DieFace key={i} value={d} size="sm" />
                        ))}
                        <span className="text-xs font-mono text-muted-foreground ml-1">
                          = <span className="text-foreground font-semibold">{rollData.total}</span>
                          {" "}· <span className="text-primary">{rollData.skillName} {rollData.skillLevel}</span>
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        isAi
                          ? "bg-card border border-border text-foreground"
                          : "bg-primary/10 border border-primary/20 text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bottom Input Area ── */}
          <div className="shrink-0 border-t border-border bg-background">
            {isEnded ? (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground font-mono">
                This shift has ended. The incident report has been filed.
              </div>
            ) : !isMyTurn ? (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground font-mono">
                <Clock className="w-4 h-4 inline mr-2 opacity-60" />
                Waiting for another operator to take their turn…
              </div>
            ) : (
              <div className="px-4 py-3 space-y-2.5">
                {/* Step indicator */}
                <div className="flex items-center gap-2">
                  <StepBadge step={step} />
                  {step === 2 && selectedSkill && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {selectedSkill.name} {selectedSkill.level} selected
                    </span>
                  )}
                </div>

                {/* Step 1: Action description */}
                <Textarea
                  placeholder="Describe what you do. Be specific — the more creative, the better the skill you might earn."
                  value={actionText}
                  onChange={(e) => {
                    setActionText(e.target.value);
                    if (step === 2 || step === 3) {
                      // Allow editing action text but keep skill selected
                    }
                  }}
                  className="resize-none bg-card border-border text-foreground placeholder:text-muted-foreground text-sm"
                  rows={2}
                  disabled={step === 3}
                />

                {/* Step 2: Dice roll preview + submit */}
                {step >= 2 && selectedSkill && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Animated dice */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isRolling
                        ? Array.from({ length: selectedSkill.level }).map((_, i) => (
                            <RollingDie key={i} finalValue={rolledDice[i] ?? 1} delay={i * 80} />
                          ))
                        : rolledDice.map((d, i) => <DieFace key={i} value={d} />)
                      }
                      {!isRolling && rolledDice.length > 0 && (
                        <span className="text-sm font-mono text-muted-foreground ml-1">
                          = <span className="text-foreground font-bold">{rolledDice.reduce((a, b) => a + b, 0)}</span>
                        </span>
                      )}
                    </div>

                    {/* Re-roll */}
                    {!isRolling && (
                      <button
                        onClick={() => rollSkill(selectedSkill)}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                      >
                        re-roll
                      </button>
                    )}

                    {/* Submit */}
                    {!isRolling && (
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-8 text-xs font-mono ml-auto"
                        onClick={handleSubmit}
                        disabled={submitAction.isPending || isRolling}
                      >
                        <Dices className="w-3.5 h-3.5" />
                        {submitAction.isPending ? "Submitting…" : "Submit Action"}
                      </Button>
                    )}
                  </div>
                )}

                {/* Hint when no skill selected */}
                {step === 1 && (
                  <p className="text-xs text-muted-foreground font-mono">
                    After describing your action, select a skill from your manifest on the left to roll.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
