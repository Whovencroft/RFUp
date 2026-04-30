import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bot,
  User,
  ChevronLeft,
  Dices,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function DieFace({ value }: { value: number }) {
  const dots: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };
  const isSix = value === 6;
  return (
    <div
      className={`relative w-9 h-9 rounded-md border-2 flex items-center justify-center shrink-0 ${
        isSix
          ? "border-primary bg-primary/20"
          : "border-border bg-card"
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-6 h-6">
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function AiSession() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const { user } = useAuth();
  const feedRef = useRef<HTMLDivElement>(null);

  // Form state
  const [actionText, setActionText] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState(1);
  const [diceInputs, setDiceInputs] = useState<number[]>([1]);

  const { data: session, refetch: refetchSession } = trpc.aiGm.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: 5000 }
  );

  const { data: messages, refetch: refetchMessages } = trpc.aiGm.getMessages.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: 5000 }
  );

  const { data: myChar } = trpc.character.get.useQuery();

  const submitAction = trpc.aiGm.submitAction.useMutation({
    onSuccess: () => {
      setActionText("");
      refetchMessages();
      refetchSession();
      toast.success("Action submitted.");
    },
    onError: (e) => toast.error(e.message),
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync dice count to skill level
  useEffect(() => {
    setDiceInputs(Array(skillLevel).fill(1));
  }, [skillLevel]);

  if (!session) {
    return (
      <div className="container py-16 text-center text-muted-foreground">
        Loading session…
      </div>
    );
  }

  const playerOrder: number[] = JSON.parse(session.playerOrder || "[]");
  const isMyTurn = session.currentTurnUserId === user?.id;
  const isEnded = session.status === "ended";

  function handleDieChange(idx: number, val: number) {
    setDiceInputs((prev) => prev.map((d, i) => (i === idx ? Math.min(6, Math.max(1, val)) : d)));
  }

  function handleSubmit() {
    if (!actionText.trim()) return toast.error("Describe your action first.");
    if (!skillName.trim()) return toast.error("Name the skill you're using.");
    submitAction.mutate({
      sessionId,
      actionDescription: actionText.trim(),
      skillName: skillName.trim(),
      skillLevel,
      diceResults: diceInputs,
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground shrink-0">
                <ChevronLeft className="w-4 h-4" />
                Sessions
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">{session.title}</h1>
              <p className="text-xs text-muted-foreground font-mono">
                {isEnded ? "SHIFT ENDED" : isMyTurn ? "YOUR TURN" : "WAITING FOR ANOTHER OPERATOR"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEnded ? (
              <Badge variant="outline" className="text-muted-foreground border-border font-mono text-xs">
                ENDED
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
                  <>
                    <Zap className="w-3 h-3 mr-1" /> YOUR TURN
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" /> WAITING
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto container py-6 space-y-4"
        style={{ maxHeight: "calc(100vh - 280px)" }}
      >
        {(!messages || messages.length === 0) && (
          <div className="text-center text-muted-foreground py-12 text-sm">
            Waiting for the shift to begin…
          </div>
        )}

        {messages?.map((msg) => {
          const isAi = msg.authorType === "ai";
          const rollData = msg.rollData ? JSON.parse(msg.rollData) : null;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAi ? "" : "flex-row-reverse"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                  isAi
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] space-y-2 ${isAi ? "" : "items-end flex flex-col"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {msg.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {msg.isIncidentChain && (
                    <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      INCIDENT CHAIN
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {rollData.dice.map((d: number, i: number) => (
                      <DieFace key={i} value={d} />
                    ))}
                    <span className="text-xs font-mono text-muted-foreground ml-1">
                      = <span className="text-foreground font-semibold">{rollData.total}</span>
                      {" "}using <span className="text-primary">{rollData.skillName} {rollData.skillLevel}</span>
                    </span>
                  </div>
                )}

                {/* Message content */}
                <div
                  className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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

      {/* ── Action Form ── */}
      {!isEnded && (
        <div className="border-t border-border bg-background">
          <div className="container py-4">
            {!isMyTurn ? (
              <div className="text-center text-sm text-muted-foreground py-2 font-mono">
                <Clock className="w-4 h-4 inline mr-2 opacity-60" />
                Waiting for another operator to take their turn…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-primary font-semibold tracking-widest">
                    YOUR TURN — {myChar?.name ?? "OPERATOR"}
                  </span>
                </div>

                {/* Action description */}
                <Textarea
                  placeholder="Describe what you do. Be specific — the more creative, the better the skill you might earn."
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  className="resize-none bg-card border-border text-foreground placeholder:text-muted-foreground text-sm"
                  rows={2}
                />

                {/* Skill + dice row */}
                <div className="flex flex-wrap gap-3 items-end">
                  {/* Skill name */}
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs font-mono text-muted-foreground mb-1 block">SKILL USED</label>
                    <Input
                      placeholder="e.g. Do Anything, Badge Reader Expertise 2"
                      value={skillName}
                      onChange={(e) => setSkillName(e.target.value)}
                      className="bg-card border-border text-foreground text-sm h-9"
                    />
                  </div>

                  {/* Skill level */}
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-1 block">LEVEL (# DICE)</label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-border"
                        onClick={() => setSkillLevel((l) => Math.max(1, l - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-mono font-semibold text-foreground">
                        {skillLevel}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-border"
                        onClick={() => setSkillLevel((l) => Math.min(10, l + 1))}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Dice results */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-mono text-muted-foreground mb-1 block">
                      DICE RESULTS (roll physically, enter here)
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {diceInputs.map((d, i) => (
                        <input
                          key={i}
                          type="number"
                          min={1}
                          max={6}
                          value={d}
                          onChange={(e) => handleDieChange(i, parseInt(e.target.value) || 1)}
                          className="w-10 h-9 text-center text-sm font-mono font-semibold bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-primary"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-9 shrink-0"
                    onClick={handleSubmit}
                    disabled={submitAction.isPending}
                  >
                    <Dices className="w-4 h-4" />
                    {submitAction.isPending ? "Submitting…" : "Submit Action"}
                  </Button>
                </div>

                {/* Quick skill picker from character */}
                {myChar?.skills && myChar.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs font-mono text-muted-foreground self-center">Quick pick:</span>
                    {myChar.skills.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSkillName(s.name);
                          setSkillLevel(s.level);
                        }}
                        className="text-xs font-mono px-2 py-1 rounded border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                      >
                        {s.name} {s.level}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isEnded && (
        <div className="border-t border-border bg-background">
          <div className="container py-4 text-center text-sm text-muted-foreground font-mono">
            This shift has ended. The incident report has been filed.
          </div>
        </div>
      )}
    </div>
  );
}
