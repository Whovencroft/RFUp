import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Zap, Star, LogIn, Loader2, ChevronRight, Pencil, Check, X,
  Printer, GitBranch, Radio, Sparkles, Award,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

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
function CharacterEdit({
  character,
  onDone,
}: {
  character: { id: number; name: string; jobTitle: string; callsign?: string | null; bio?: string | null };
  onDone: () => void;
}) {
  const [name, setName] = useState(character.name);
  const [jobTitle, setJobTitle] = useState(character.jobTitle);
  const [callsign, setCallsign] = useState(character.callsign ?? "");
  const [bio, setBio] = useState(character.bio ?? "");
  const utils = trpc.useUtils();
  const update = trpc.character.update.useMutation({
    onSuccess: () => {
      toast.success("Operator file updated.");
      utils.character.get.invalidate();
      onDone();
    },
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
      <div>
        <Label className="text-xs font-mono text-muted-foreground mb-1 block">CALLSIGN <span className="opacity-50">(optional)</span></Label>
        <Input value={callsign} onChange={(e) => setCallsign(e.target.value)} placeholder="e.g. GHOST-7, STATIC, WRAITH" className="bg-input border-border text-foreground h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs font-mono text-muted-foreground mb-1 block">PERSONNEL BIO <span className="opacity-50">(optional)</span></Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Background, specializations, notable incidents survived..."
          className="bg-input border-border text-foreground text-sm resize-none"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-3 text-xs gap-1"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              name: name.trim(),
              jobTitle: jobTitle.trim(),
              callsign: callsign.trim() || undefined,
              bio: bio.trim() || undefined,
            })
          }
        >
          <Check className="w-3 h-3" /> Save
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs gap-1" onClick={onDone}>
          <X className="w-3 h-3" /> Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Skill Lineage Tree ────────────────────────────────────────────────────
function SkillLineageTree({ skills }: { skills: { id: number; name: string; level: number; parentSkillId?: number | null }[] }) {
  const roots = skills.filter((s) => !s.parentSkillId);
  const getChildren = (id: number) => skills.filter((s) => s.parentSkillId === id);
  function SkillNode({ skill, depth }: { skill: typeof skills[0]; depth: number }) {
    const children = getChildren(skill.id);
    return (
      <div className={cn("relative", depth > 0 && "ml-4 pl-3 border-l border-border/50")}>
        <div className="flex items-center gap-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
          <span className="text-xs text-foreground">{skill.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">L{skill.level}</span>
        </div>
        {children.map((child) => (
          <SkillNode key={child.id} skill={child} depth={depth + 1} />
        ))}
      </div>
    );
  }
  if (skills.length === 0) return null;
  return (
    <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/50">
      <p className="text-[10px] font-mono text-muted-foreground mb-2 tracking-widest">SKILL LINEAGE</p>
      {roots.map((root) => (
        <SkillNode key={root.id} skill={root} depth={0} />
      ))}
    </div>
  );
}

// ── Main Play Page ─────────────────────────────────────────────────────────
export default function Play() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: character, isLoading } = trpc.character.get.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  // Real commendations from DB
  const { data: commendations, isLoading: commendationsLoading } = trpc.commendations.listMine.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [editingChar, setEditingChar] = useState(false);
  const [showLineage, setShowLineage] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [generatingAvatar, setGeneratingAvatar] = useState(false);

  const generateAvatarMutation = trpc.character.generateAvatar.useMutation({
    onSuccess: () => {
      setGeneratingAvatar(false);
      utils.character.get.invalidate();
      toast.success("Avatar generated!");
      setShowAvatarDialog(false);
      setAvatarPrompt("");
    },
    onError: (e) => { setGeneratingAvatar(false); toast.error(e.message); },
  });

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

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: Identity + Skills ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Identity Card */}
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
                {/* Avatar + Name */}
                <div className="flex items-start gap-3 mt-2">
                  <button
                    onClick={() => setShowAvatarDialog(true)}
                    className="relative flex-shrink-0 group"
                    title="Generate avatar"
                  >
                    {character.avatarUrl ? (
                      <img src={character.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-lg object-cover border border-border group-hover:border-primary/50 transition-colors" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-border bg-background flex items-center justify-center group-hover:border-primary/50 transition-colors">
                        <Sparkles className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary/60" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-display font-bold text-foreground leading-tight">{character.name}</h2>
                    {character.callsign && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Radio className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="text-xs font-mono text-primary tracking-widest">{character.callsign}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">{character.jobTitle}</p>
                  </div>
                </div>

                {/* XP + skill count */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-mono font-medium text-amber-400">{character.xp} XP</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {character.skills?.length ?? 0} skill{(character.skills?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                  {(commendations?.length ?? 0) > 0 && (
                    <span className="text-xs text-amber-400/80 font-mono flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {commendations!.length} commendation{commendations!.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bio */}
          {!editingChar && (
            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono text-primary tracking-widest">PERSONNEL BIO</p>
                <button onClick={() => setEditingChar(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              {character.bio ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{character.bio}</p>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic">
                  No bio on file. Click the edit icon to add your operator's background.
                </p>
              )}
            </div>
          )}

          {/* Skill Manifest */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-primary tracking-widest">SKILL MANIFEST</p>
              {(character.skills?.length ?? 0) > 1 && (
                <button
                  onClick={() => setShowLineage((v) => !v)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors",
                    showLineage ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitBranch className="w-3 h-3" />
                  <span className="hidden sm:inline">Lineage</span>
                </button>
              )}
            </div>
            {showLineage && <SkillLineageTree skills={character.skills ?? []} />}
            <div className="space-y-2">
              {(character.skills ?? []).map((skill) => (
                <div
                  key={skill.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{skill.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">Roll {skill.level}d6</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: skill.level }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-muted-foreground fill-muted-foreground" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3 font-mono">
              Dice rolling happens inside AI sessions.
            </p>
          </div>
        </div>

        {/* ── Right: Commendations ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Commendations */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-xs font-mono text-primary tracking-widest mb-4 flex items-center gap-1.5">
              <Award className="w-3 h-3" />
              COMMENDATIONS
            </p>
            {commendationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : !commendations || commendations.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No commendations on file.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Commendations are awarded by the Shift Supervisor at the end of a shift.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {commendations.map((c) => (
                  <div key={c.id} className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-mono text-amber-400 tracking-widest">COMMENDATION</p>
                      <p className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{c.reason}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono">
                      Awarded by {c.awardedByName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-xs font-mono text-primary tracking-widest mb-3">QUICK ACCESS</p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/lobby">
                <div className="p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors cursor-pointer group">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Enter the Facility</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Join an active session</p>
                </div>
              </Link>
              <Link href="/sessions">
                <div className="p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors cursor-pointer group">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">AI Sessions</p>
                  <p className="text-xs text-muted-foreground mt-0.5">View all sessions</p>
                </div>
              </Link>
              <Link href="/incidents">
                <div className="p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors cursor-pointer group">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Incident Board</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Active security incidents</p>
                </div>
              </Link>
              <Link href="/print" target="_blank">
                <div className="p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors cursor-pointer group">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Print Sheet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Printer-friendly character sheet</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Generation Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Generate Operator Avatar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Describe what you want your operator to look like. The AI will generate a small portrait.
          </p>
          <div>
            <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">DESCRIPTION</Label>
            <Input
              value={avatarPrompt}
              onChange={(e) => setAvatarPrompt(e.target.value)}
              placeholder="e.g. weathered security guard, cyberpunk vibes, green tactical vest"
              className="bg-input border-border text-foreground"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAvatarDialog(false)}>Cancel</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!avatarPrompt.trim() || generatingAvatar || generateAvatarMutation.isPending}
              onClick={() => {
                setGeneratingAvatar(true);
                generateAvatarMutation.mutate({ prompt: avatarPrompt.trim() });
              }}
            >
              {generatingAvatar || generateAvatarMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
