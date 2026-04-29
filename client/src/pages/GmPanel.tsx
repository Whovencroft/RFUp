import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDiff, setNewDiff] = useState(7);
  const [editingDiff, setEditingDiff] = useState<{ id: number; value: number } | null>(null);

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

      {/* Tabs */}
      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="bg-muted/30 border border-border mb-6 h-10">
          <TabsTrigger value="incidents" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5" />
            Incidents
            {incidents && (
              <span className="ml-1 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                {incidents.filter((i) => i.isActive).length} active
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="operators" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            Operator Files
            {sheets && (
              <span className="ml-1 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                {sheets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="personnel" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            Personnel
            {userList && userList.filter((u) => u.role === "admin").length > 0 && (
              <span className="ml-1 text-xs font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                {userList.filter((u) => u.role === "admin").length} supervisors
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheets.map((char) => (
                <div key={char.id} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{char.name}</p>
                      <p className="text-xs text-muted-foreground">{char.jobTitle}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-mono text-amber-400">{char.xp} XP</span>
                    </div>
                  </div>
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
      </Tabs>

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
