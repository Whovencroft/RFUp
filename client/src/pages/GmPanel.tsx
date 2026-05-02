import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Zap,
  Star,
  Lock,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Users,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Trash2,
  ScrollText,
  Bot,
  ChevronRight,
  Award,
  Bell,
  BellOff,
  UserCheck,
  UserX,
  Clock,
  Activity,
  CheckCheck,
  Calendar,
  RefreshCw,
  History,
  ChevronDown,
} from "lucide-react";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState as useLocalState } from "react";

// ── Operator File Card (expandable, shows session history) ────────────────
function OperatorFileCard({ char }: {
  char: { id: number; name: string; jobTitle: string; xp: number; skills?: { id: number; name: string; level: number }[] | null };
}) {
  const [expanded, setExpanded] = useLocalState(false);
  const { data: history, isLoading: historyLoading } = trpc.character.getSessionHistoryByCharId.useQuery(
    { characterId: char.id },
    { enabled: expanded }
  );
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header row */}
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{char.name}</p>
            <p className="text-xs text-muted-foreground">{char.jobTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-mono text-amber-400">{char.xp} XP</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {(char.skills ?? []).length} skill{(char.skills ?? []).length !== 1 ? "s" : ""}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/10">
          {/* Skills */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">SKILL MANIFEST</p>
            <div className="space-y-1.5">
              {(char.skills ?? []).map((skill) => (
                <div key={skill.id} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{skill.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: skill.level }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 text-primary fill-primary" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session History */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-1">
              <History className="w-3 h-3" /> SHIFT HISTORY
            </p>
            {historyLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : !history || history.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic">No shifts on record.</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((s) => (
                  <Link key={s.id} href={`/sessions/${s.id}`}>
                    <div className="flex items-center justify-between p-2 rounded border border-border bg-background hover:border-primary/30 transition-colors cursor-pointer group">
                      <div className="min-w-0">
                        <p className="text-xs text-foreground group-hover:text-primary transition-colors truncate">{s.title}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono border rounded px-1.5 py-0.5 shrink-0 ml-2",
                        s.status === "active"
                          ? "text-primary border-primary/30 bg-primary/10"
                          : "text-muted-foreground border-border bg-muted"
                      )}>
                        {s.status === "active" ? "ACTIVE" : "ENDED"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GmPanel() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: incidents, isLoading: incidentsLoading } = trpc.incidents.allForGm.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: sheets, isLoading: sheetsLoading } = trpc.gm.allSheets.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: userList, isLoading: usersLoading } = trpc.gm.listUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateIncident = trpc.incidents.update.useMutation({
    onSuccess: () => {
      toast.success("Incident updated.");
      utils.incidents.allForGm.invalidate();
      utils.incidents.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const createIncident = trpc.incidents.create.useMutation({
    onSuccess: () => {
      toast.success("Incident created.");
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewDiff(7);
      utils.incidents.allForGm.invalidate();
      utils.incidents.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const setRole = trpc.gm.setRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated.");
      utils.gm.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const clearLog = trpc.gm.clearSessionLog.useMutation({
    onSuccess: () => {
      toast.success("Session log cleared. New shift started.");
      setConfirmClear(false);
      utils.sessionLog.recent.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDiff, setNewDiff] = useState(7);
  const [editingDiff, setEditingDiff] = useState<{ id: number; value: number } | null>(null);

  // ── AI Session launcher state ──────────────────────────────────────────────────────
  const [aiSessionTitle, setAiSessionTitle] = useState("");
  const [aiSelectedIncidentId, setAiSelectedIncidentId] = useState<string>("random");
  const [aiSelectedPlayerIds, setAiSelectedPlayerIds] = useState<number[]>([]);
  const [aiGmMode, setAiGmMode] = useState<"ai" | "supervisor">("ai");

  // Shift scheduler state
  const [schedLabel, setSchedLabel] = useState("");
  const [schedCron, setSchedCron] = useState("0 0 9 * * 1");
  const [schedDesc, setSchedDesc] = useState("");
  const [schedEnabled, setSchedEnabled] = useState(true);

  const { data: schedules, refetch: refetchSchedules } = trpc.shiftSchedules.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createSchedule = trpc.shiftSchedules.create.useMutation({
    onSuccess: () => {
      toast.success("Shift schedule created.");
      setSchedLabel(""); setSchedCron("0 0 9 * * 1"); setSchedDesc("");
      refetchSchedules();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const updateSchedule = trpc.shiftSchedules.update.useMutation({
    onSuccess: () => refetchSchedules(),
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const deleteSchedule = trpc.shiftSchedules.delete.useMutation({
    onSuccess: () => { toast.success("Schedule removed."); refetchSchedules(); },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const generateBriefing = trpc.shiftSchedules.generateBriefing.useMutation({
    onSuccess: (data) => {
      setSchedLabel(data.label);
      setSchedDesc(data.briefingMessage);
      toast.success("AI briefing generated. Review and save.");
    },
    onError: (e) => toast.error("Briefing generation failed: " + e.message),
  });

  const { data: aiSessions, refetch: refetchAiSessions } = trpc.aiGm.listSessions.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  // ── Supervisor Notifications ──────────────────────────────────────────────
  const { data: notifications, refetch: refetchNotifications } = trpc.supervisorNotifications.list.useQuery(
    undefined,
    {
      enabled: isAuthenticated && user?.role === "admin",
      refetchInterval: 30000,
    }
  );
  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;

  const markNotificationsRead = trpc.supervisorNotifications.markRead.useMutation({
    onSuccess: () => {
      utils.supervisorNotifications.list.invalidate();
    },
  });
  const { data: allUsers } = trpc.gm.listUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createAiSession = trpc.aiGm.createSession.useMutation({
    onSuccess: (data) => {
      toast.success(aiGmMode === "supervisor" ? "Supervisor-led session started!" : "AI session started!");
      setAiSessionTitle("");
      setAiSelectedIncidentId("random");
      setAiSelectedPlayerIds([]);
      setAiGmMode("ai");
      refetchAiSessions();
    },
    onError: (e) => toast.error(e.message),
  });

  const endAiSession = trpc.aiGm.endSession.useMutation({
    onSuccess: () => { toast.success("Session ended."); refetchAiSessions(); },
    onError: (e) => toast.error(e.message),
  });

  // ── Commendation state ────────────────────────────────────────────────────
  const [commendDialog, setCommendDialog] = useState<{ sessionId: number; sessionTitle: string } | null>(null);
  const [commendCharId, setCommendCharId] = useState<string>("");
  const [commendReason, setCommendReason] = useState("");

  const awardCommendation = trpc.commendations.create.useMutation({
    onSuccess: () => {
      toast.success("Commendation awarded.");
      setCommendDialog(null);
      setCommendCharId("");
      setCommendReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  // Derive character list for commendation dialog — scoped to session participants
  const commendCharOptions = (() => {
    if (!commendDialog || !aiSessions || !sheets) return sheets ?? [];
    const session = aiSessions.find((s) => s.id === commendDialog.sessionId);
    if (!session) return sheets ?? [];
    let playerUserIds: number[] = [];
    try { playerUserIds = JSON.parse((session as any).playerOrder || "[]"); } catch {}
    if (playerUserIds.length === 0) return sheets ?? [];
    // allSheets spreads all character columns including userId
    return (sheets as any[]).filter((c) => playerUserIds.includes(c.userId));
  })();

  function togglePlayer(uid: number) {
    setAiSelectedPlayerIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }

  // ── Access denied ──────────────────────────────────────────────────────────
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Shift Supervisor clearance required.
          </p>
          <div className="text-left rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-mono text-amber-400 tracking-widest mb-1">HOW TO GET ACCESS</p>
            <p className="text-sm text-muted-foreground">
              The <strong className="text-foreground">first person to sign in</strong> to this app is automatically granted Shift Supervisor access.
            </p>
            <p className="text-sm text-muted-foreground">
              That person can promote others by going to <strong className="text-foreground">Shift Supervisor → Personnel tab</strong> and clicking <strong className="text-foreground">Promote</strong> next to any signed-in operator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── GM Panel ───────────────────────────────────────────────────────────────
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono text-amber-400 mb-2 tracking-widest">SHIFT SUPERVISOR</p>
          <h1 className="text-3xl font-display font-semibold text-foreground mb-1">GM Panel</h1>
          <p className="text-muted-foreground text-sm">
            Manage incidents, review operator files, and control personnel access.
          </p>
        </div>
        <Button
          className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 gap-2"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4" />
          New Incident
        </Button>
      </div>

      {/* Supervisor Briefing */}
      <div className="mb-8 p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <p className="text-xs font-mono text-amber-400 mb-3 tracking-widest">RUNNING THE FACILITY</p>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Your job is to present the incident, set the opposing roll difficulty, and decide whether
            a player's creative interpretation of <span className="text-foreground italic">"Aggressive Visitor De-escalation 3"</span> is
            actually applicable to the situation at hand. It usually is. Let them roll.
          </p>
          <p>
            When someone fails, make things worse — but keep it mundane or absurd, not punishing.
            The goal is a good story and a longer incident report, not a dead operator.
            Encourage specific, ridiculous skills. The more granular the better.
          </p>
          <p>
            If a player wants to use their badge reader expertise to negotiate with a rogue drone,
            that's exactly the kind of thing this game is for. Keep it moving.
            The SLA isn't going to maintain itself.
          </p>
        </div>
        <p className="mt-4 text-xs font-mono text-amber-400/70 border-t border-amber-500/20 pt-3">
          The first operator to sign in is automatically granted Shift Supervisor access. Promote others from the Personnel tab below.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personnel" className="w-full">
        <TabsList className="bg-muted/30 border border-border mb-6 h-auto flex-wrap gap-y-1 py-1">
          <TabsTrigger value="incidents" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5" />
            Incidents
            {incidents && (
              <span className="ml-1 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                {incidents.filter((i) => i.isActive).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="operators" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            Operators
            {sheets && (
              <span className="ml-1 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                {sheets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="session-log" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <ScrollText className="w-3.5 h-3.5" />
            Session Log
          </TabsTrigger>
          <TabsTrigger value="personnel" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            Personnel
            {userList && userList.filter((u) => u.role === "admin").length > 0 && (
              <span className="ml-1 text-xs font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                {userList.filter((u) => u.role === "admin").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            Scheduler
          </TabsTrigger>
          <TabsTrigger value="ai-sessions" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <Bot className="w-3.5 h-3.5" />
            Sessions
            {aiSessions && aiSessions.filter((s) => s.status === "active").length > 0 && (
              <span className="ml-1 text-xs font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30">
                {aiSessions.filter((s) => s.status === "active").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <Bell className="w-3.5 h-3.5" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 text-xs font-mono bg-destructive/80 text-destructive-foreground px-1.5 py-0.5 rounded border border-destructive/40">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Incidents Tab ── */}
        <TabsContent value="incidents" className="mt-0">
          {incidentsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !incidents || incidents.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No incidents on file. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    incident.isActive
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {incident.isActive && (
                          <span className="text-xs font-mono text-primary border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                        <p className="text-sm font-semibold text-foreground truncate">{incident.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Difficulty */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground font-mono">DC</span>
                        {editingDiff?.id === incident.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 border-border text-xs"
                              onClick={() => setEditingDiff((e) => e ? { ...e, value: Math.max(2, e.value - 1) } : null)}
                            >−</Button>
                            <span className="font-mono text-sm text-foreground w-6 text-center">{editingDiff.value}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 border-border text-xs"
                              onClick={() => setEditingDiff((e) => e ? { ...e, value: Math.min(20, e.value + 1) } : null)}
                            >+</Button>
                            <Button
                              size="sm"
                              className="h-6 px-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => { updateIncident.mutate({ id: incident.id, difficulty: editingDiff.value }); setEditingDiff(null); }}
                            >Save</Button>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditingDiff(null)}>✕</Button>
                          </div>
                        ) : (
                          <button
                            className="text-xs font-mono text-foreground hover:text-primary transition-colors underline decoration-dotted w-6 text-center"
                            onClick={() => setEditingDiff({ id: incident.id, value: incident.difficulty })}
                          >
                            {incident.difficulty}
                          </button>
                        )}
                      </div>
                      {/* Toggle active */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-2 gap-1 text-xs",
                          incident.isActive
                            ? "text-primary hover:text-destructive"
                            : "text-muted-foreground hover:text-primary"
                        )}
                        onClick={() => updateIncident.mutate({ id: incident.id, isActive: !incident.isActive })}
                        disabled={updateIncident.isPending}
                      >
                        {incident.isActive ? (
                          <><ToggleRight className="w-4 h-4" /> Deactivate</>
                        ) : (
                          <><ToggleLeft className="w-4 h-4" /> Activate</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Session Log Tab ── */}
        <TabsContent value="session-log" className="mt-0">
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-mono text-primary mb-1 tracking-widest">SESSION LOG</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Clear the session log to start a fresh shift. All roll history, XP events, and skill gains
                  will be permanently removed from the feed.
                </p>
              </div>
            </div>

            {!confirmClear ? (
              <Button
                variant="outline"
                className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive mt-2"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 className="w-4 h-4" />
                Clear Session Log
              </Button>
            ) : (
              <div className="mt-2 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="text-sm font-semibold text-destructive mb-1">Confirm: Clear all session log entries?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  This cannot be undone. All roll history, XP events, and skill gains will be permanently removed.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
                    disabled={clearLog.isPending}
                    onClick={() => clearLog.mutate()}
                  >
                    {clearLog.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Yes, clear the log
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Operator Files Tab ── */}
        <TabsContent value="operators" className="mt-0">
          {sheetsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !sheets || sheets.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No operators have clocked in yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sheets.map((char) => (
                <OperatorFileCard key={char.id} char={char} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Personnel Tab ── */}
        <TabsContent value="personnel" className="mt-0">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground max-w-xl">
              Grant or revoke <strong className="text-foreground">Shift Supervisor</strong> access for any signed-in operator.
              Supervisors can manage incidents, view all operator files, and promote others.
            </p>
          </div>
          {usersLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-mono text-muted-foreground font-normal tracking-widest">OPERATOR</th>
                    <th className="text-left px-4 py-3 text-xs font-mono text-muted-foreground font-normal tracking-widest">ROLE</th>
                    <th className="text-left px-4 py-3 text-xs font-mono text-muted-foreground font-normal tracking-widest hidden sm:table-cell">LAST SIGN-IN</th>
                    <th className="px-4 py-3 text-right text-xs font-mono text-muted-foreground font-normal tracking-widest">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(userList ?? []).map((u, idx) => (
                    <tr
                      key={u.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{u.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{u.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs font-mono border rounded px-2 py-0.5",
                          u.role === "admin"
                            ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                            : "text-muted-foreground border-border bg-muted/30"
                        )}>
                          {u.role === "admin" ? "SHIFT SUPERVISOR" : "OPERATOR"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono hidden sm:table-cell">
                        {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== user?.id ? (
                          u.role === "admin" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-3 text-xs text-muted-foreground hover:text-destructive gap-1.5"
                              disabled={setRole.isPending}
                              onClick={() => setRole.mutate({ userId: u.id, role: "user" })}
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-3 text-xs text-muted-foreground hover:text-amber-400 gap-1.5"
                              disabled={setRole.isPending}
                              onClick={() => setRole.mutate({ userId: u.id, role: "admin" })}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Promote
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground/40 font-mono px-3">you</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!userList || userList.length === 0) && (
                <div className="text-center py-10">
                  <p className="text-xs text-muted-foreground">No operators have signed in yet.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── AI Sessions Tab ── */}
        {/* ── Shift Scheduler Tab ── */}
        <TabsContent value="scheduler" className="mt-0">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Create schedule */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <p className="text-xs font-mono text-primary tracking-widest mb-1">NEW RECURRING SHIFT</p>
                <p className="text-sm text-muted-foreground">Schedule a recurring shift briefing posted to the Session Log on a cron schedule.</p>
              </div>
              <div>
                <Label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">LABEL</Label>
                <Input value={schedLabel} onChange={(e) => setSchedLabel(e.target.value)} placeholder="e.g. Monday Morning Briefing" className="bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">CRON EXPRESSION (6-field)</Label>
                <Input value={schedCron} onChange={(e) => setSchedCron(e.target.value)} placeholder="0 0 9 * * 1" className="bg-input border-border text-foreground font-mono" />
                <p className="text-xs text-muted-foreground mt-1">Format: sec min hour day month weekday — e.g. <code className="font-mono">0 0 9 * * 1</code> = every Monday 9 AM</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-mono text-muted-foreground tracking-widest">BRIEFING MESSAGE</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1"
                    onClick={() => generateBriefing.mutate()}
                    disabled={generateBriefing.isPending}
                  >
                    {generateBriefing.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                    Generate
                  </Button>
                </div>
                <Textarea value={schedDesc} onChange={(e) => setSchedDesc(e.target.value)} placeholder="What should the AI post as the shift briefing? Click Generate to auto-fill from the incident pool." className="bg-input border-border text-foreground resize-none" rows={3} />
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                disabled={!schedLabel.trim() || !schedCron.trim() || createSchedule.isPending}
                onClick={() => createSchedule.mutate({ title: schedLabel.trim(), cronExpression: schedCron.trim() })}
              >
                {createSchedule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Create Schedule
              </Button>
            </div>

            {/* Schedule list */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-muted-foreground tracking-widest">ACTIVE SCHEDULES</p>
              {!schedules || schedules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-muted-foreground">No schedules yet.</p>
                </div>
              ) : (
                  schedules.map((sched) => (
                    <div key={sched.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-card gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{sched.title}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{sched.cronExpression}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost" size="sm"
                          className={`h-7 px-2 text-xs ${sched.isActive ? "text-primary" : "text-muted-foreground"}`}
                          onClick={() => updateSchedule.mutate({ id: sched.id, isActive: !sched.isActive })}
                          title={sched.isActive ? "Disable" : "Enable"}
                        >
                          {sched.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => deleteSchedule.mutate({ id: sched.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-sessions" className="mt-0">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Launcher */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <p className="text-xs font-mono text-primary tracking-widest mb-1">LAUNCH NEW AI SESSION</p>
                <p className="text-sm text-muted-foreground">
                  The AI Shift Supervisor will pick up the incident, brief the team, and run the shift play-by-post.
                  Each player takes turns describing their action and submitting their dice results.
                </p>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">SESSION TITLE</label>
                <Input
                  value={aiSessionTitle}
                  onChange={(e) => setAiSessionTitle(e.target.value)}
                  placeholder="e.g. Night Shift — Corridor B Incident"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">INCITING INCIDENT</label>
                <Select value={aiSelectedIncidentId} onValueChange={setAiSelectedIncidentId}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Let the AI choose" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="random">Let the AI choose</SelectItem>
                    {incidents?.map((inc) => (
                      <SelectItem key={inc.id} value={String(inc.id)}>
                        {inc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">SELECT PLAYERS</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {(allUsers ?? []).map((u) => (
                    <label key={u.id} className="flex items-center gap-3 cursor-pointer group">
                      <Checkbox
                        checked={aiSelectedPlayerIds.includes(u.id)}
                        onCheckedChange={() => togglePlayer(u.id)}
                        className="border-border"
                      />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {u.name ?? u.email ?? `User #${u.id}`}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {u.role === "admin" ? "SUPERVISOR" : "OPERATOR"}
                      </span>
                    </label>
                  ))}
                  {(!allUsers || allUsers.length === 0) && (
                    <p className="text-xs text-muted-foreground">No operators have signed in yet.</p>
                  )}
                </div>
              </div>
              {/* GM Mode toggle */}
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">SESSION MODE</label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono transition-colors",
                      aiGmMode === "ai"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setAiGmMode("ai")}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    AI-LED
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono transition-colors border-l border-border",
                      aiGmMode === "supervisor"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setAiGmMode("supervisor")}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    SUPERVISOR-LED
                  </button>
                </div>
                {aiGmMode === "supervisor" && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                    You write the narrative responses. Players submit actions and rolls as normal.
                  </p>
                )}
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                disabled={
                  !aiSessionTitle.trim() ||
                  aiSelectedPlayerIds.length === 0 ||
                  createAiSession.isPending
                }
                onClick={() =>
                  createAiSession.mutate({
                    title: aiSessionTitle.trim(),
                    incitingIncidentId:
                      aiSelectedIncidentId !== "random" ? parseInt(aiSelectedIncidentId) : undefined,
                    playerUserIds: aiSelectedPlayerIds,
                    gmMode: aiGmMode,
                  })
                }
              >
                {createAiSession.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : aiGmMode === "supervisor" ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                {createAiSession.isPending
                  ? "Starting shift…"
                  : aiGmMode === "supervisor"
                  ? "Start Supervisor Session"
                  : "Start AI Session"}
              </Button>
            </div>

            {/* Session list */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-muted-foreground tracking-widest">EXISTING SESSIONS</p>
              {!aiSessions || aiSessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Bot className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-muted-foreground">No sessions yet.</p>
                </div>
              ) : (
                aiSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        {s.status === "active" ? (
                          <span className="text-primary">ACTIVE</span>
                        ) : (
                          <span>ENDED</span>
                        )}
                        {" · "}{new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/sessions/${s.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
                          View <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                      {s.status === "ended" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-amber-400/70 hover:text-amber-400 gap-1"
                          onClick={() => setCommendDialog({ sessionId: s.id, sessionTitle: s.title })}
                        >
                          <Award className="w-3 h-3" /> Commend
                        </Button>
                      )}
                      {s.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                          disabled={endAiSession.isPending}
                          onClick={() => endAiSession.mutate({ sessionId: s.id })}
                        >
                          End
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications" className="mt-0">
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground tracking-widest mb-0.5">SUPERVISOR FEED</p>
                <p className="text-sm text-muted-foreground">
                  Player activity across your sessions — auto-refreshes every 30 seconds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => refetchNotifications()}
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                    disabled={markNotificationsRead.isPending}
                    onClick={() => {
                      const unreadIds = (notifications ?? [])
                        .filter((n) => !n.isRead)
                        .map((n) => n.id);
                      if (unreadIds.length > 0) markNotificationsRead.mutate({ ids: unreadIds });
                    }}
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* Feed */}
            {!notifications || notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <BellOff className="w-7 h-7 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Activity from your sessions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => {
                  const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
                    player_acted: {
                      icon: <UserCheck className="w-4 h-4" />,
                      label: "ACTED",
                      color: "text-primary",
                      bg: "bg-primary/10 border-primary/20",
                    },
                    turn_waiting: {
                      icon: <Clock className="w-4 h-4" />,
                      label: "WAITING",
                      color: "text-amber-400",
                      bg: "bg-amber-500/10 border-amber-500/20",
                    },
                    turn_skipped: {
                      icon: <Activity className="w-4 h-4" />,
                      label: "SKIPPED",
                      color: "text-muted-foreground",
                      bg: "bg-muted/20 border-border",
                    },
                    player_kicked: {
                      icon: <UserX className="w-4 h-4" />,
                      label: "REMOVED",
                      color: "text-destructive",
                      bg: "bg-destructive/10 border-destructive/20",
                    },
                    player_inactive: {
                      icon: <Clock className="w-4 h-4" />,
                      label: "INACTIVE",
                      color: "text-amber-400",
                      bg: "bg-amber-500/10 border-amber-500/20",
                    },
                  };
                  const cfg = typeConfig[notif.type] ?? {
                    icon: <Bell className="w-4 h-4" />,
                    label: notif.type.toUpperCase(),
                    color: "text-muted-foreground",
                    bg: "bg-muted/20 border-border",
                  };
                  const createdAt = notif.createdAt instanceof Date ? notif.createdAt : new Date(notif.createdAt);
                  const relativeTime = (() => {
                    const diffMs = Date.now() - createdAt.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    if (diffMins < 1) return "just now";
                    if (diffMins < 60) return `${diffMins}m ago`;
                    const diffHrs = Math.floor(diffMins / 60);
                    if (diffHrs < 24) return `${diffHrs}h ago`;
                    return `${Math.floor(diffHrs / 24)}d ago`;
                  })();

                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-lg border transition-colors cursor-pointer",
                        notif.isRead
                          ? "border-border bg-card opacity-60 hover:opacity-80"
                          : `${cfg.bg} hover:opacity-90`
                      )}
                      onClick={() => {
                        if (!notif.isRead) markNotificationsRead.mutate({ ids: [notif.id] });
                      }}
                    >
                      {/* Icon tile */}
                      <div className={cn("shrink-0 w-8 h-8 rounded-md flex items-center justify-center border", cfg.bg, cfg.color)}>
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-[10px] font-mono tracking-widest font-semibold", cfg.color)}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground/60 truncate">
                            {notif.sessionTitle}
                          </span>
                          {!notif.isRead && (
                            <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-foreground leading-snug">{notif.message}</p>
                      </div>

                      {/* Timestamp */}
                      <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                        {relativeTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Award Commendation Dialog */}
      <Dialog open={!!commendDialog} onOpenChange={(open) => { if (!open) { setCommendDialog(null); setCommendCharId(""); setCommendReason(""); } }}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Award Commendation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Award a formal commendation to an operator for their performance in{" "}
            <span className="text-foreground font-medium">{commendDialog?.sessionTitle}</span>.
            It will appear on their Operator File dossier.
          </p>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">OPERATOR</Label>
              <Select value={commendCharId} onValueChange={setCommendCharId}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select an operator..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {commendCharOptions.map((char) => (
                    <SelectItem key={char.id} value={String(char.id)}>
                      {char.name} — {char.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">REASON</Label>
              <Textarea
                value={commendReason}
                onChange={(e) => setCommendReason(e.target.value)}
                placeholder="Describe the action or decision that earned this commendation..."
                className="bg-input border-border text-foreground resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setCommendDialog(null); setCommendCharId(""); setCommendReason(""); }}>Cancel</Button>
            <Button
              className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 gap-2"
              disabled={!commendCharId || !commendReason.trim() || awardCommendation.isPending}
              onClick={() => {
                if (!commendDialog || !commendCharId) return;
                const char = commendCharOptions.find((c) => c.id === parseInt(commendCharId));
                if (!char) return;
                awardCommendation.mutate({
                  sessionId: commendDialog.sessionId,
                  characterId: char.id,
                  characterName: char.name,
                  reason: commendReason.trim(),
                });
              }}
            >
              {awardCommendation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Award Commendation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Incident Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">New Incident</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Create a new security incident for the board. Keep scenarios within the purview of
            the security team: access control, surveillance, vendor management, network anomalies.
          </p>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">INCIDENT TITLE</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Unscheduled Biometric Enrollment"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">DESCRIPTION</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Describe the incident in detail. What happened? What's the complication?"
                className="bg-input border-border text-foreground min-h-[100px] resize-none"
              />
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1.5 block tracking-widest">DIFFICULTY (opposing roll)</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 border-border" onClick={() => setNewDiff((v) => Math.max(2, v - 1))}>−</Button>
                <span className="font-mono text-lg text-foreground w-8 text-center">{newDiff}</span>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 border-border" onClick={() => setNewDiff((v) => Math.min(20, v + 1))}>+</Button>
                <span className="text-xs text-muted-foreground font-mono ml-2">Players must roll {newDiff + 1}+ to succeed</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!newTitle.trim() || !newDesc.trim() || createIncident.isPending}
              onClick={() => createIncident.mutate({ title: newTitle.trim(), description: newDesc.trim(), difficulty: newDiff })}
            >
              {createIncident.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
