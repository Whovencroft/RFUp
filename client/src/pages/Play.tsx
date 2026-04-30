import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Dices, Plus, Zap, Star, LogIn, Loader2, ChevronRight, Pencil, Check, X, AlertTriangle, Printer } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
// ── Dice Face ──────────────────────────────────────────────────────────────
function DieFace({ value, rolling, isSix }: { value: number; rolling: boolean; isSix: boolean }) {
  const dots: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };

  return (
    <div
      className={cn(
        "w-12 h-12 rounded-lg border-2 relative transition-all duration-200",
        isSix
          ? "border-primary bg-primary/15 shadow-[0_0_12px_oklch(0.72_0.12_165/0.4)]"
          : "border-border bg-card",
        rolling && "dice-rolling"
      )}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-1">
        {(dots[value] ?? []).map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={isSix ? 10 : 9}
            fill={isSix ? "oklch(0.72 0.12 165)" : "oklch(0.75 0.01 240)"}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Character Creation ─────────────────────────────────────────────────────
function CharacterCreation({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const createChar = trpc.character.create.useMutation({
    onSuccess: () => { toast.success("Character created. Welcome to Facility 404."); onCreated(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-md mx-auto">
      <div className="p-6 rounded-xl border border-border bg-card">
        <p className="text-xs font-mono text-primary mb-1 tracking-widest">NEW OPERATOR</p>
        <h2 className="text-2xl font-display font-semibold text-foreground mb-1">Clock In</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Create your character to begin your shift at Facility 404.
          All operators start with one skill: <span className="font-mono text-primary">Do Anything 1</span>.
        </p>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">OPERATOR NAME</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Agent Torres, Unit 7, Dave"
              className="bg-input border-border text-foreground"
            />
          </div>
          <div>
            <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">JOB TITLE</Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Badge Reader Whisperer, Night Shift Sentinel"
              className="bg-input border-border text-foreground"
            />
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!name.trim() || !jobTitle.trim() || createChar.isPending}
            onClick={() => createChar.mutate({ name: name.trim(), jobTitle: jobTitle.trim() })}
          >
            {createChar.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Begin Shift
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Character Edit ────────────────────────────────────────────────────────
function CharacterEdit({ character, onDone }: { character: { id: number; name: string; jobTitle: string }; onDone: () => void }) {
  const [name, setName] = useState(character.name);
  const [jobTitle, setJobTitle] = useState(character.jobTitle);
  const utils = trpc.useUtils();
  const update = trpc.character.update.useMutation({
    onSuccess: () => { toast.success("Operator file updated."); utils.character.get.invalidate(); onDone(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-mono text-muted-foreground mb-1 block">NAME</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-input border-border text-foreground h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs font-mono text-muted-foreground mb-1 block">JOB TITLE</Label>
        <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="bg-input border-border text-foreground h-8 text-sm" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-3 text-xs gap-1" disabled={update.isPending} onClick={() => update.mutate({ name: name.trim(), jobTitle: jobTitle.trim() })}>
          <Check className="w-3 h-3" /> Save
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs gap-1" onClick={onDone}>
          <X className="w-3 h-3" /> Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Main Play Page ─────────────────────────────────────────────────────────
export default function Play() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: character, isLoading } = trpc.character.get.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  // Active incident — poll every 10s so the banner stays live during a session
  const { data: activeIncidents } = trpc.incidents.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
    select: (data) => data.filter((i) => i.isActive),
  });
  // Use the first active incident as the "primary" for auto-syncing difficulty
  const activeIncident = activeIncidents?.[0] ?? null;
  const hasMultiple = (activeIncidents?.length ?? 0) > 1;

  // Auto-sync opposing roll when the active incident changes
  useEffect(() => {
    if (activeIncident) {
      setOpposingRoll(activeIncident.difficulty);
    }
  }, [activeIncident?.id, activeIncident?.difficulty]);

  const [editingChar, setEditingChar] = useState(false);

  // Dice state
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{ dice: number[]; sum: number; success: boolean; allSixes: boolean; newXp: number } | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [xpToSpend, setXpToSpend] = useState(0);
  const [opposingRoll, setOpposingRoll] = useState(7);

  // New skill dialog
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [pendingSkillLevel, setPendingSkillLevel] = useState(2);

  const rollMutation = trpc.dice.roll.useMutation({
    onSuccess: (data) => {
      setRolling(false);
      setRollResult(data);
      utils.character.get.invalidate();
      if (data.allSixes) {
        const skill = character?.skills?.find((s) => s.id === selectedSkillId);
        setPendingSkillLevel((skill?.level ?? 1) + 1);
        setNewSkillName(skill?.name ? `${skill.name} (Specialized)` : "");
        setShowSkillDialog(true);
        toast.success("All sixes! You may gain a new skill.", { duration: 5000 });
      } else if (!data.success) {
        toast.info("Failed roll — 1 XP awarded.");
      } else {
        toast.success("Success!");
      }
    },
    onError: (e) => { setRolling(false); toast.error(e.message); },
  });

  const addSkillMutation = trpc.skills.add.useMutation({
    onSuccess: () => {
      toast.success(`New skill added!`);
      setShowSkillDialog(false);
      utils.character.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRoll = () => {
    if (!character || selectedSkillId === null) return;
    const skill = character.skills?.find((s) => s.id === selectedSkillId);
    if (!skill) return;
    setRolling(true);
    setRollResult(null);
    setTimeout(() => {
      rollMutation.mutate({
        skillName: skill.name,
        skillLevel: skill.level,
        xpToSpend,
        opposingRoll,
      });
    }, 550);
  };

  if (authLoading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sign in to clock in for your shift at Facility 404.
          </p>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="container py-16">
        <CharacterCreation onCreated={() => utils.character.get.invalidate()} />
      </div>
    );
  }

  const selectedSkill = character.skills?.find((s) => s.id === selectedSkillId);

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: Character Sheet ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Identity */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-mono text-primary tracking-widest">OPERATOR FILE</p>
              <div className="flex items-center gap-2">
                <Link
                  href="/print"
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Print character sheet"
                >
                  <Printer className="w-3.5 h-3.5" />
                </Link>
                {!editingChar && (
                  <button onClick={() => setEditingChar(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            {editingChar ? (
              <CharacterEdit character={character} onDone={() => setEditingChar(false)} />
            ) : (
              <>
                <h2 className="text-2xl font-display font-bold text-foreground mt-2">{character.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{character.jobTitle}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-mono font-medium text-amber-400">{character.xp} XP</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {character.skills?.length ?? 0} skill{(character.skills?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Skills */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-xs font-mono text-primary mb-3 tracking-widest">SKILL MANIFEST</p>
            <div className="space-y-2">
              {(character.skills ?? []).map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => { setSelectedSkillId(skill.id); setRollResult(null); }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                    selectedSkillId === skill.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-background hover:border-border/80 hover:bg-accent/50"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{skill.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">Roll {skill.level}d6</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: skill.level }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3 h-3",
                          selectedSkillId === skill.id ? "text-primary fill-primary" : "text-muted-foreground fill-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Dice Roller ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Active Incident Banner */}
          {activeIncidents && activeIncidents.length > 0 ? (
            <div className="space-y-2">
              {activeIncidents.map((inc) => (
                <div key={inc.id} className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-amber-400 tracking-widest">ACTIVE INCIDENT</span>
                      <span className="text-xs font-mono border border-amber-500/30 bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                        DC {inc.difficulty}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{inc.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{inc.description}</p>
                  </div>
                </div>
              ))}
              {hasMultiple && (
                <p className="text-xs text-muted-foreground font-mono px-1">
                  Multiple incidents active — opposing roll auto-set to DC {activeIncident?.difficulty}.
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground font-mono">No active incident — Shift Supervisor has not set a scenario.</p>
            </div>
          )}

          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-xs font-mono text-primary mb-3 tracking-widest">DICE ROLLER</p>

            {!selectedSkill ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Select a skill from your manifest to roll.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-display font-semibold text-foreground">{selectedSkill.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">Level {selectedSkill.level} — rolling {selectedSkill.level}d6</p>
                  </div>
                  <Badge variant="outline" className="font-mono border-primary/30 text-primary">
                    {selectedSkill.level}d6
                  </Badge>
                </div>

                {/* Controls */}
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">
                      OPPOSING ROLL (Difficulty)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 border-border"
                        onClick={() => setOpposingRoll((v) => Math.max(2, v - 1))}
                      >−</Button>
                      <span className="font-mono text-lg text-foreground w-8 text-center">{opposingRoll}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 border-border"
                        onClick={() => setOpposingRoll((v) => Math.min(30, v + 1))}
                      >+</Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">
                      SPEND XP (convert die to 6)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 border-border"
                        onClick={() => setXpToSpend((v) => Math.max(0, v - 1))}
                        disabled={xpToSpend === 0}
                      >−</Button>
                      <span className={cn("font-mono text-lg w-8 text-center", xpToSpend > 0 ? "text-amber-400" : "text-foreground")}>
                        {xpToSpend}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0 border-border"
                        onClick={() => setXpToSpend((v) => Math.min(character.xp, selectedSkill.level, v + 1))}
                        disabled={xpToSpend >= Math.min(character.xp, selectedSkill.level)}
                      >+</Button>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({character.xp} available)
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base gap-2"
                  onClick={handleRoll}
                  disabled={rolling || rollMutation.isPending}
                >
                  {rolling ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Rolling…</>
                  ) : (
                    <><Dices className="w-4 h-4" /> Roll {selectedSkill.level}d6</>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Roll Result */}
          {rollResult && (
            <div
              className={cn(
                "p-5 rounded-xl border fade-in-up",
                rollResult.allSixes
                  ? "border-primary/50 bg-primary/10"
                  : rollResult.success
                  ? "border-primary/30 bg-primary/5"
                  : "border-destructive/30 bg-destructive/5"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">ROLL RESULT</p>
                  <p
                    className={cn(
                      "text-2xl font-display font-bold",
                      rollResult.allSixes
                        ? "text-primary"
                        : rollResult.success
                        ? "text-primary"
                        : "text-destructive"
                    )}
                  >
                    {rollResult.allSixes ? "ALL SIXES — NEW SKILL!" : rollResult.success ? "SUCCESS" : "FAILURE"}
                  </p>
                  {!rollResult.success && (
                    <p className="text-xs text-amber-400 font-mono mt-1">+1 XP awarded</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-muted-foreground">SUM vs DIFFICULTY</p>
                  <p className="text-2xl font-mono font-bold text-foreground">
                    {rollResult.sum} <span className="text-muted-foreground text-base">vs</span> {opposingRoll}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {rollResult.dice.map((d, i) => (
                  <DieFace key={i} value={d} rolling={false} isSix={d === 6} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Skill Dialog */}
      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              All Sixes — New Skill Unlocked
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You rolled all 6s using <span className="text-primary font-medium">{selectedSkill?.name}</span>. 
            Name your new Level {pendingSkillLevel} skill — it should be more specific than the one you used.
          </p>
          <div>
            <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">NEW SKILL NAME</Label>
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder={`e.g. ${selectedSkill?.name} (Specialized) ${pendingSkillLevel}`}
              className="bg-input border-border text-foreground"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1.5 font-mono">
              This will be a Level {pendingSkillLevel} skill — you roll {pendingSkillLevel}d6 when using it.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSkillDialog(false)}>Skip</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!newSkillName.trim() || addSkillMutation.isPending}
              onClick={() =>
                addSkillMutation.mutate({ name: newSkillName.trim(), level: pendingSkillLevel })
              }
            >
              {addSkillMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
