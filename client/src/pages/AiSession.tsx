import { useState, useEffect, useRef, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTurnNotification } from "@/hooks/useTurnNotification";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bot,
  User,
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Printer,
  Star,
  Sparkles,
  Loader2,
  Link2,
  StickyNote,
  MessageSquare,
  FileText,
  Shield,
  Send,
  SkipForward,
  UserX,
  ChevronDown,
  Library,
} from "lucide-react";
import { Textarea as TextareaEl } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
        isSix ? "border-primary bg-primary/20" : "border-border bg-card"
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

// ── Skill Advancement Dialog ──────────────────────────────────────────────────

interface SkillAdvancementDialogProps {
  open: boolean;
  suggestedName: string;
  level: number;
  isLoading: boolean;
  onConfirm: (name: string, level: number) => void;
  onDismiss: () => void;
}

function SkillAdvancementDialog({
  open,
  suggestedName,
  level,
  isLoading,
  onConfirm,
  onDismiss,
}: SkillAdvancementDialogProps) {
  const [name, setName] = useState(suggestedName);

  // Sync when suggestion arrives
  useEffect(() => {
    if (suggestedName) setName(suggestedName);
  }, [suggestedName]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            All Sixes — New Skill Unlocked
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            You rolled all 6s. In Roll for Shoes, that earns you a new, more specific skill.
            The AI has suggested a name based on what you just did — edit it if you want, then confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating skill name…
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground tracking-widest">
                  NEW SKILL NAME
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border text-foreground font-semibold"
                  placeholder="e.g. Override Tailgating Lockout Protocol"
                  maxLength={100}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">LEVEL</span>
                <span className="text-sm font-bold text-primary font-mono">{level}</span>
                <div className="flex items-center gap-0.5 ml-1">
                  {Array.from({ length: level }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-primary fill-primary" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Remember: each new skill must be more specific than the one it derives from.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 justify-start sm:justify-start">
          <Button
            onClick={() => onConfirm(name.trim(), level)}
            disabled={isLoading || !name.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Add to Manifest
          </Button>
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground font-mono text-xs"
          >
            Skip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AiSession() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const { user } = useAuth();
  const feedRef = useRef<HTMLDivElement>(null);

  // Input state
  const [actionText, setActionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dice animation state (shown inline in feed area while rolling)
  const [pendingSkill, setPendingSkill] = useState<{ name: string; level: number } | null>(null);
  const [pendingDice, setPendingDice] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  // Skill advancement dialog state
  const [advancementOpen, setAdvancementOpen] = useState(false);
  const [suggestedSkillName, setSuggestedSkillName] = useState("");
  const [suggestedSkillLevel, setSuggestedSkillLevel] = useState(2);
  const [isSuggestingName, setIsSuggestingName] = useState(false);

  // XP spend prompt state (shown after dice settle, before auto-submit)
  const [xpSpendPrompt, setXpSpendPrompt] = useState<{
    skill: { name: string; level: number };
    results: number[];
    xpAvailable: number;
    nonSixCount: number;
  } | null>(null);

  // GM panel state
  const [showGmPanel, setShowGmPanel] = useState(false);
  const [gmNotes, setGmNotes] = useState("");
  const [gmChatText, setGmChatText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const { user: authUser } = useAuth();
  const isGm = authUser?.role === "admin";

  // Supervisor-led response state
  const [supervisorResponseText, setSupervisorResponseText] = useState("");
  const [supervisorDcSet, setSupervisorDcSet] = useState<string>("");
  const [supervisorSkillRuling, setSupervisorSkillRuling] = useState<"approved" | "denied" | "partial" | "">("approved");
  const [supervisorAdvanceTurn, setSupervisorAdvanceTurn] = useState(true);
  const [supervisorAwardXp, setSupervisorAwardXp] = useState(false);

  // Supervisor incident injection state
  const [showInjectIncident, setShowInjectIncident] = useState(false);
  const [injectTitle, setInjectTitle] = useState("");
  const [injectDesc, setInjectDesc] = useState("");
  const [injectDc, setInjectDc] = useState<string>("");
  const [injectLibraryId, setInjectLibraryId] = useState<string>(""); // "" = custom

  // Supervisor skip/kick state
  const [kickConfirmUserId, setKickConfirmUserId] = useState<number | null>(null);
  const [kickReason, setKickReason] = useState("");

  // Incident library for quick-inject
  const { data: incidentLibrary } = trpc.incidents.list.useQuery(undefined, {
    enabled: isGm,
  });

  // Player activity for 24h inactivity soft-warning
  const { data: playerActivity } = trpc.aiGm.getPlayerActivity.useQuery(
    { sessionId },
    { enabled: isGm, refetchInterval: 60_000 }
  );
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const isActiveRecently = (uid: number) => {
    const entry = playerActivity?.find((a) => a.userId === uid);
    if (!entry || entry.lastActionAt === null) return false;
    return Date.now() - entry.lastActionAt < TWENTY_FOUR_HOURS;
  };

  const skipTurnMutation = trpc.aiGm.skipTurn.useMutation({
    onSuccess: () => {
      refetchSession();
      refetchMessages();
      toast.success("Turn skipped.");
    },
    onError: (e) => toast.error(e.message),
  });

  const kickPlayerMutation = trpc.aiGm.kickPlayer.useMutation({
    onSuccess: () => {
      setKickConfirmUserId(null);
      setKickReason("");
      refetchSession();
      refetchMessages();
      toast.success("Player removed from session.");
    },
    onError: (e) => toast.error(e.message),
  });

  const injectIncidentMutation = trpc.aiGm.supervisorInjectIncident.useMutation({
    onSuccess: () => {
      setInjectTitle("");
      setInjectDesc("");
      setInjectDc("");
      setShowInjectIncident(false);
      refetchMessages();
      refetchSession();
      toast.success("Incident injected.");
    },
    onError: (e) => toast.error(e.message),
  });

  const supervisorRespondMutation = trpc.aiGm.supervisorRespond.useMutation({
    onSuccess: (data) => {
      setSupervisorResponseText("");
      setSupervisorDcSet("");
      setSupervisorSkillRuling("approved");
      setSupervisorAdvanceTurn(true);
      setSupervisorAwardXp(false);
      refetchMessages();
      refetchSession();
      refetchChar();
      if (data?.xpAwarded) {
        toast.success("+1 XP awarded to the current operator.");
      } else {
        toast.success("Response posted.");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const saveGmNotesMutation = trpc.aiGm.updateGmNotes.useMutation({
    onSuccess: () => { setSavingNotes(false); toast.success("Notes saved."); },
    onError: (err: { message: string }) => { setSavingNotes(false); toast.error(err.message); },
  });

  const sendGmChatMutation = trpc.aiGm.gmSendMessage.useMutation({
    onSuccess: () => { setGmChatText(""); refetchMessages(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const { data: session, refetch: refetchSession } = trpc.aiGm.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: 5000 }
  );

  const { data: messages, refetch: refetchMessages } = trpc.aiGm.getMessages.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: 5000 }
  );

  const { data: myChar, refetch: refetchChar } = trpc.character.get.useQuery(
    undefined,
    { refetchInterval: 5000 } // poll so XP updates live when supervisor awards it
  );

  const playerOrder: number[] = JSON.parse(session?.playerOrder || "[]");
  const { data: allChars } = trpc.character.listAll.useQuery(
    undefined,
    { enabled: playerOrder.length > 1 }
  );
  const allies = allChars?.filter(
    (c) => c.userId !== user?.id && playerOrder.includes(c.userId)
  ) ?? [];

  const submitAction = trpc.aiGm.submitAction.useMutation({
    onSuccess: (data) => {
      setActionText("");
      setPendingSkill(null);
      setPendingDice([]);
      setIsSubmitting(false);
      refetchMessages();
      refetchSession();
      refetchChar();
      if (data?.xpAwarded) {
        toast.success("+1 XP awarded for a failed roll.");
      }
    },
    onError: (e) => {
      toast.error(e.message);
      setIsSubmitting(false);
    },
  });

  const suggestName = trpc.skills.suggestName.useMutation({
    onSuccess: (data) => {
      setSuggestedSkillName(data.suggestedName);
      setSuggestedSkillLevel(data.level);
      setIsSuggestingName(false);
    },
    onError: (_err, variables) => {
      // Deterministic fallback: derive a name from the action text
      const words = variables.actionDescription.trim().split(/\s+/).slice(0, 5);
      const fallback = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      setSuggestedSkillName(fallback || `${variables.usedSkillName} Specialist`);
      setSuggestedSkillLevel(variables.usedSkillLevel + 1);
      setIsSuggestingName(false);
    },
  });

  const addSkill = trpc.skills.add.useMutation({
    onSuccess: () => {
      toast.success("New skill added to your manifest.");
      setAdvancementOpen(false);
      refetchChar();
    },
    onError: (e) => toast.error(e.message),
  });

  // Auto-scroll feed to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, isRolling]);

  // Finalise and submit after dice are settled (and optionally after XP spend)
  const doSubmit = useCallback(
    (skill: { name: string; level: number }, results: number[], spendXp: boolean) => {
      setXpSpendPrompt(null);
      setIsSubmitting(true);
      const allSixes = results.every((d) => d === 6);
      const xp = myChar?.xp ?? 0;
      const nonSixCount = results.filter((d) => d < 6).length;
      const canUpgradeWithXp = !allSixes && nonSixCount > 0 && xp >= nonSixCount;
      const finalDice = spendXp ? results.map(() => 6) : results;

      submitAction.mutate(
        {
          sessionId,
          actionDescription: actionText.trim(),
          skillName: skill.name,
          skillLevel: skill.level,
          diceResults: finalDice,
          xpToSpend: spendXp ? nonSixCount : 0,
        },
        {
          onSettled: () => {
            if (allSixes || canUpgradeWithXp || spendXp) {
              setIsSuggestingName(true);
              setAdvancementOpen(true);
              suggestName.mutate({
                actionDescription: actionText.trim(),
                usedSkillName: skill.name,
                usedSkillLevel: skill.level,
              });
            }
          },
        }
      );
    },
    [actionText, myChar?.xp, sessionId, submitAction, suggestName]
  );

  // Roll dice for selected skill — pauses for XP spend prompt if applicable, then submits
  const rollAndSubmit = useCallback(
    (skill: { name: string; level: number }) => {
      if (!actionText.trim()) {
        toast.error("Describe your action first.");
        return;
      }
      if (isSubmitting || isRolling) return;

      const results = Array.from({ length: skill.level }, () => Math.floor(Math.random() * 6) + 1);
      setPendingSkill(skill);
      setPendingDice(results);
      setIsRolling(true);

      // After animation settles (~900ms), check for XP spend opportunity
      setTimeout(() => {
        setIsRolling(false);
        const allSixes = results.every((d) => d === 6);
        const xp = myChar?.xp ?? 0;
        const nonSixCount = results.filter((d) => d < 6).length;
        const canSpendXp = !allSixes && nonSixCount > 0 && xp >= nonSixCount;

        if (canSpendXp) {
          // Pause and show XP spend prompt — user decides before submitting
          setXpSpendPrompt({ skill, results, xpAvailable: xp, nonSixCount });
        } else {
          doSubmit(skill, results, false);
        }
      }, 950);
    },
    [actionText, isSubmitting, isRolling, myChar?.xp, doSubmit]
  );

  const isMyTurn = session?.currentTurnUserId === user?.id;
  useTurnNotification(isMyTurn, session?.title ?? "AI Session");
  const isEnded = session?.status === "ended";
  const isSupervisorMode = (session as any)?.gmMode === "supervisor";

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono text-sm">
        Loading session…
      </div>
    );
  }

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
          <div className="shrink-0 flex items-center gap-2">
            {/* Invite link */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              title="Copy invite link"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Invite link copied to clipboard.");
              }}
            >
              <Link2 className="w-3.5 h-3.5" />
            </Button>

            {/* Debrief link (ended sessions) */}
            {isEnded && (
              <Link href={`/sessions/${sessionId}/debrief`}>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" title="View debrief">
                  <FileText className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}

            {/* GM panel toggle */}
            {isGm && (
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 ${showGmPanel ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                title="Shift Supervisor panel"
                onClick={() => setShowGmPanel((v) => !v)}
              >
                <Shield className="w-3.5 h-3.5" />
              </Button>
            )}

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
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── LEFT PANEL: Operator File ── */}
        <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-border flex flex-col overflow-hidden bg-background max-h-56 lg:max-h-none">

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

          {/* Skill Manifest — scrollable, click to roll + auto-submit */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <p className="text-xs font-mono text-muted-foreground tracking-widest px-1 mb-2">SKILL MANIFEST</p>
            {isMyTurn && !isEnded && !isSubmitting && !isRolling && (
              <p className="text-xs text-muted-foreground font-mono px-1 mb-3 leading-relaxed">
                Describe your action below, then click a skill to roll and submit automatically.
              </p>
            )}
            {skills.map((s) => {
              const isActive = pendingSkill?.name === s.name && pendingSkill?.level === s.level;
              const canClick = isMyTurn && !isEnded && !isSubmitting && !isRolling;
              return (
                <button
                  key={s.id}
                  onClick={() => canClick && rollAndSubmit({ name: s.name, level: s.level })}
                  disabled={!canClick}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                    isActive
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                      {s.name}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: s.level }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${isActive ? "text-primary fill-primary" : "text-muted-foreground fill-muted-foreground"}`}
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

        {/* ── GM PANEL (admin only, collapsible) ── */}
        {isGm && showGmPanel && (
          <div className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border flex flex-col overflow-hidden bg-background max-h-64 lg:max-h-none">
            <div className="p-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-mono text-primary tracking-widest">SUPERVISOR PANEL</p>
                {isSupervisorMode && (
                  <span className="ml-auto text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">
                    MANUAL MODE
                  </span>
                )}
              </div>
            </div>

            {/* Supervisor Response (only in supervisor-led sessions) */}
            {isSupervisorMode && !isEnded && (
              <div className="p-3 border-b border-border shrink-0">
                <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> NARRATIVE RESPONSE
                </p>
                <TextareaEl
                  value={supervisorResponseText}
                  onChange={(e) => setSupervisorResponseText(e.target.value)}
                  placeholder="Write your narrative response to the player's action…"
                  className="resize-none bg-card border-border text-foreground text-xs"
                  rows={5}
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1">DC SET</label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={supervisorDcSet}
                      onChange={(e) => setSupervisorDcSet(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-full rounded-md border border-border bg-card text-foreground text-xs px-2 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1">SKILL RULING</label>
                    <select
                      value={supervisorSkillRuling}
                      onChange={(e) => setSupervisorSkillRuling(e.target.value as any)}
                      className="w-full rounded-md border border-border bg-card text-foreground text-xs px-2 py-1.5 font-mono"
                    >
                      <option value="approved">✓ Approved</option>
                      <option value="partial">~ Partial</option>
                      <option value="denied">✗ Denied</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="advanceTurn"
                    checked={supervisorAdvanceTurn}
                    onChange={(e) => setSupervisorAdvanceTurn(e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="advanceTurn" className="text-[10px] font-mono text-muted-foreground cursor-pointer">
                    Advance turn after posting
                  </label>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="awardXp"
                    checked={supervisorAwardXp}
                    onChange={(e) => setSupervisorAwardXp(e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="awardXp" className="text-[10px] font-mono text-amber-400 cursor-pointer flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Award 1 XP to current operator
                  </label>
                </div>
                <Button
                  size="sm"
                  className="mt-2 h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-1.5"
                  disabled={!supervisorResponseText.trim() || supervisorRespondMutation.isPending}
                  onClick={() => supervisorRespondMutation.mutate({
                    sessionId,
                    content: supervisorResponseText.trim(),
                    dcSet: supervisorDcSet ? parseInt(supervisorDcSet) : undefined,
                    skillRuling: supervisorSkillRuling || undefined,
                    advanceTurn: supervisorAdvanceTurn,
                    awardXp: supervisorAwardXp,
                  })}
                >
                  {supervisorRespondMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Post Response
                </Button>
              </div>
            )}

            {/* Inject Incident (supervisor mode only) */}
            {isSupervisorMode && !isEnded && (
              <div className="p-3 border-b border-border shrink-0">
                <button
                  className="w-full flex items-center justify-between text-xs font-mono text-muted-foreground tracking-widest hover:text-foreground transition-colors"
                  onClick={() => setShowInjectIncident((v) => !v)}
                >
                  <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> INJECT INCIDENT</span>
                  <span className="text-[10px]">{showInjectIncident ? "▲" : "▼"}</span>
                </button>
                {showInjectIncident && (
                  <div className="mt-2 space-y-2">
                    {/* Library picker */}
                    {incidentLibrary && incidentLibrary.length > 0 && (
                      <div className="relative">
                        <select
                          value={injectLibraryId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setInjectLibraryId(id);
                            if (id) {
                              const inc = incidentLibrary.find((i) => String(i.id) === id);
                              if (inc) {
                                setInjectTitle(inc.title);
                                setInjectDesc(inc.description ?? "");
                                setInjectDc(String(inc.difficulty ?? ""));
                              }
                            } else {
                              setInjectTitle("");
                              setInjectDesc("");
                              setInjectDc("");
                            }
                          }}
                          className="w-full rounded-md border border-border bg-card text-foreground text-xs px-2 py-1.5 font-mono appearance-none pr-6"
                        >
                          <option value="">— Custom incident —</option>
                          {incidentLibrary.map((inc) => (
                            <option key={inc.id} value={String(inc.id)}>
                              [{inc.difficulty}] {inc.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={injectTitle}
                      onChange={(e) => { setInjectTitle(e.target.value); setInjectLibraryId(""); }}
                      placeholder="Incident title…"
                      className="w-full rounded-md border border-border bg-card text-foreground text-xs px-2 py-1.5 font-mono"
                    />
                    <TextareaEl
                      value={injectDesc}
                      onChange={(e) => { setInjectDesc(e.target.value); setInjectLibraryId(""); }}
                      placeholder="Description (optional)…"
                      className="resize-none bg-card border-border text-foreground text-xs"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={injectDc}
                        onChange={(e) => setInjectDc(e.target.value)}
                        placeholder="DC"
                        className="w-20 rounded-md border border-border bg-card text-foreground text-xs px-2 py-1.5 font-mono"
                      />
                      <Button
                        size="sm"
                        className="flex-1 h-7 px-3 text-xs bg-amber-500 text-black hover:bg-amber-400 gap-1.5"
                        disabled={!injectTitle.trim() || injectIncidentMutation.isPending}
                        onClick={() => {
                          injectIncidentMutation.mutate({
                            sessionId,
                            title: injectTitle.trim(),
                            description: injectDesc.trim() || undefined,
                            dc: injectDc ? parseInt(injectDc) : undefined,
                          });
                          setInjectLibraryId("");
                        }}
                      >
                        {injectIncidentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                        Inject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skip / Kick controls (supervisor mode only, session not ended) */}
            {isSupervisorMode && !isEnded && (
              <div className="p-3 border-b border-border shrink-0">
                <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-1.5">
                  <UserX className="w-3 h-3" /> PLAYER MANAGEMENT
                </p>
                {/* Skip current turn */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs font-mono gap-1.5 mb-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  disabled={skipTurnMutation.isPending}
                  onClick={() => skipTurnMutation.mutate({ sessionId })}
                >
                  {skipTurnMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <SkipForward className="w-3 h-3" />}
                  Skip Current Turn
                </Button>
                {/* Kick player buttons */}
                {playerOrder.length > 0 && (
                  <div className="space-y-1">
                    {playerOrder.map((uid) => {
                      const char = allChars?.find((c) => c.userId === uid);
                      const charName = char?.name ?? `Operator #${uid}`;
                      const isCurrent = uid === (session as any)?.currentTurnUserId;
                      const activeRecently = isActiveRecently(uid);
                      return (
                        <div key={uid} className="flex items-center gap-1.5">
                          <span className={`flex-1 text-[10px] font-mono truncate ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                            {isCurrent ? "▶ " : ""}{charName}
                          </span>
                          {activeRecently && (
                            <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1 py-0.5 shrink-0">
                              ACTIVE
                            </span>
                          )}
                          <button
                            className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors px-1 shrink-0"
                            onClick={() => setKickConfirmUserId(uid)}
                          >
                            KICK
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Private Notes */}
            <div className="p-3 border-b border-border shrink-0">
              <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-1.5">
                <StickyNote className="w-3 h-3" /> PRIVATE NOTES
              </p>
              <TextareaEl
                value={gmNotes}
                onChange={(e) => setGmNotes(e.target.value)}
                placeholder="Plot notes, planned incidents, player observations…"
                className="resize-none bg-card border-border text-foreground text-xs"
                rows={4}
              />
              <Button
                size="sm"
                className="mt-2 h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                disabled={savingNotes || saveGmNotesMutation.isPending}
                onClick={() => {
                  setSavingNotes(true);
                  saveGmNotesMutation.mutate({ sessionId, notes: gmNotes });
                }}
              >
                {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Notes"}
              </Button>
            </div>

            {/* GM Chat (broadcast, available in both modes) */}
            {!isSupervisorMode && (
              <div className="flex-1 flex flex-col overflow-hidden p-3">
                <p className="text-xs font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-1.5 shrink-0">
                  <MessageSquare className="w-3 h-3" /> BROADCAST TO PLAYERS
                </p>
                <TextareaEl
                  value={gmChatText}
                  onChange={(e) => setGmChatText(e.target.value)}
                  placeholder="Send a message to the session feed as Shift Supervisor…"
                  className="resize-none bg-card border-border text-foreground text-xs flex-1"
                  rows={4}
                />
                <Button
                  size="sm"
                  className="mt-2 h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-1.5"
                  disabled={!gmChatText.trim() || sendGmChatMutation.isPending}
                  onClick={() => sendGmChatMutation.mutate({ sessionId, content: gmChatText.trim() })}
                >
                  <Send className="w-3 h-3" /> Send
                </Button>
              </div>
            )}
          </div>
        )}

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
          <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {(!messages || messages.length === 0) && !isRolling && (
              <div className="text-center text-muted-foreground py-16 text-sm font-mono">
                Waiting for the shift to begin…
              </div>
            )}

            {messages?.map((msg) => {
              const isAi = msg.authorType === "ai";
              const isGmMsg = msg.authorType === "gm";
              const isPlayer = msg.authorType === "player";
              const isLeft = isAi || isGmMsg; // AI and GM messages appear on the left
              const rollData = msg.rollData ? JSON.parse(msg.rollData) : null;

              return (
                <div key={msg.id} className={`flex gap-3 ${isLeft ? "" : "flex-row-reverse"}`}>
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isAi
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : isGmMsg
                        ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                        : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {isAi ? <Bot className="w-3.5 h-3.5" /> : isGmMsg ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[78%] space-y-1.5 ${isLeft ? "" : "items-end flex flex-col"}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-foreground">{msg.authorName}</span>
                      {isGmMsg && !isAi && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">
                          SUPERVISOR
                        </span>
                      )}
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

                    <div
                      className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isAi
                          ? "bg-card border border-border text-foreground"
                          : isGmMsg
                          ? "bg-amber-400/5 border border-amber-400/20 text-foreground"
                          : "bg-primary/10 border border-primary/20 text-foreground"
                      }`}
                    >
                      {(isAi || isGmMsg) ? (
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
                            code: ({ children }) => <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{children}</code>,
                            h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                          }}
                        >
                          {msg.content}
                        </Markdown>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Inline dice animation while rolling */}
            {isRolling && pendingSkill && pendingDice.length > 0 && (
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-7 h-7 rounded-full border bg-muted border-border flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="max-w-[78%] space-y-1.5 items-end flex flex-col">
                  <span className="text-xs font-mono font-semibold text-foreground">{myChar?.name ?? "You"}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {pendingDice.map((d, i) => (
                      <RollingDie key={i} finalValue={d} delay={i * 80} />
                    ))}
                  </div>
                  <div className="rounded-xl px-3.5 py-2.5 text-sm bg-primary/10 border border-primary/20 text-foreground">
                    {actionText}
                  </div>
                </div>
              </div>
            )}

            {/* Submitting indicator */}
            {isSubmitting && !isRolling && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isSupervisorMode ? "Waiting for Supervisor response…" : "Shift Supervisor is reviewing…"}
              </div>
            )}
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
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs text-muted-foreground font-mono">Your action</p>
                  {myChar && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-mono rounded px-2 py-0.5 border ${
                        (myChar.xp ?? 0) > 0
                          ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                          : "text-muted-foreground bg-muted border-border"
                      }`}
                      title="Spend XP to convert a die to 6 during advancement rolls"
                    >
                      <Zap className="w-3 h-3" />
                      {myChar.xp ?? 0} XP{(myChar.xp ?? 0) > 0 ? " available" : ""}
                    </span>
                  )}
                </div>
                <Textarea
                  placeholder="Describe what you do. Be specific — the more creative, the better the skill you might earn. Then click a skill in your manifest to roll."
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  className="resize-none bg-card border-border text-foreground placeholder:text-muted-foreground text-sm"
                  rows={2}
                  disabled={isSubmitting || isRolling}
                />
                {(isSubmitting || isRolling) && (
                  <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {isRolling ? "Rolling dice…" : isSupervisorMode ? "Waiting for Supervisor response…" : "Waiting for AI response…"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Skill Advancement Dialog ── */}
      <SkillAdvancementDialog
        open={advancementOpen}
        suggestedName={suggestedSkillName}
        level={suggestedSkillLevel}
        isLoading={isSuggestingName}
        onConfirm={(name, level) => {
          addSkill.mutate({ name, level });
        }}
        onDismiss={() => setAdvancementOpen(false)}
      />

      {/* ── XP Spend Prompt ── */}
      {xpSpendPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-amber-500/40 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400 text-xl">⚡</span>
              <h3 className="font-bold text-lg text-amber-300">Spend XP?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              You rolled{" "}
              <span className="font-mono font-bold text-foreground">
                [{xpSpendPrompt.results.join(", ")}]
              </span>{" "}
              on your <span className="font-semibold">{xpSpendPrompt.skill.name}</span> roll.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              You have{" "}
              <span className="font-bold text-amber-400">{xpSpendPrompt.xpAvailable} XP</span>. Spend{" "}
              <span className="font-bold text-amber-400">{xpSpendPrompt.nonSixCount} XP</span> to convert all
              dice to 6s and guarantee success?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => doSubmit(xpSpendPrompt.skill, xpSpendPrompt.results, true)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Spend {xpSpendPrompt.nonSixCount} XP — All 6s
              </button>
              <button
                onClick={() => doSubmit(xpSpendPrompt.skill, xpSpendPrompt.results, false)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Keep Roll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick Player Confirmation Dialog */}
      {kickConfirmUserId !== null && (() => {
        const kickedChar = allChars?.find((c) => c.userId === kickConfirmUserId);
        const kickedName = kickedChar?.name ?? `Operator #${kickConfirmUserId}`;
        return (
          <Dialog open onOpenChange={(open) => { if (!open) { setKickConfirmUserId(null); setKickReason(""); } }}>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-mono text-sm tracking-widest text-red-400 flex items-center gap-2">
                  <UserX className="w-4 h-4" /> REMOVE OPERATOR
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Remove <span className="font-semibold text-foreground">{kickedName}</span> from this session? They will no longer be able to take turns.
                </DialogDescription>
              </DialogHeader>
              {kickConfirmUserId !== null && isActiveRecently(kickConfirmUserId) && (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 mb-2">
                  <span className="text-amber-400 text-[10px] font-mono tracking-widest shrink-0 mt-0.5">WARNING</span>
                  <p className="text-xs text-amber-300">
                    This operator submitted an action less than 24 hours ago. They may still be active.
                  </p>
                </div>
              )}
              <div className="py-2">
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1">REASON (optional)</label>
                <input
                  type="text"
                  value={kickReason}
                  onChange={(e) => setKickReason(e.target.value)}
                  placeholder="e.g. No response for 24+ hours"
                  className="w-full rounded-md border border-border bg-background text-foreground text-xs px-2 py-1.5 font-mono"
                  maxLength={200}
                />
              </div>
              <DialogFooter className="flex-row gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs font-mono"
                  onClick={() => { setKickConfirmUserId(null); setKickReason(""); }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs font-mono bg-red-600 hover:bg-red-500 text-white gap-1.5"
                  disabled={kickPlayerMutation.isPending}
                  onClick={() => kickPlayerMutation.mutate({
                    sessionId,
                    userId: kickConfirmUserId,
                    reason: kickReason.trim() || undefined,
                  })}
                >
                  {kickPlayerMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                  Remove Operator
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
