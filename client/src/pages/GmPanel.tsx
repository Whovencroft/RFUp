import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Settings,
  Shield,
  Plus,
  Zap,
  Star,
  AlertTriangle,
  Lock,
  Loader2,
  ToggleLeft,
  ToggleRight,
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

  const updateIncident = trpc.incidents.update.useMutation({
    onSuccess: () => { toast.success("Incident updated."); utils.incidents.allForGm.invalidate(); utils.incidents.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const createIncident = trpc.incidents.create.useMutation({
    onSuccess: () => { toast.success("Incident created."); setShowCreate(false); utils.incidents.allForGm.invalidate(); utils.incidents.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDiff, setNewDiff] = useState(7);

  const [editingDiff, setEditingDiff] = useState<{ id: number; value: number } | null>(null);

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm">
            Shift Supervisor clearance required. Contact the facility administrator to request elevated access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-mono text-amber-400 mb-2 tracking-widest">SHIFT SUPERVISOR</p>
          <h1 className="text-3xl font-display font-semibold text-foreground mb-2">GM Panel</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Manage active incidents, adjust difficulty ratings, create new scenarios, and review all operator files.
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

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Incident Management ── */}
        <div className="lg:col-span-3 space-y-3">
          <p className="text-xs font-mono text-muted-foreground tracking-widest mb-3">INCIDENT MANAGEMENT</p>
          {incidentsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            (incidents ?? []).map((incident) => (
              <div
                key={incident.id}
                className={cn(
                  "p-4 rounded-lg border bg-card",
                  incident.isActive ? "border-primary/40" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-medium text-foreground">{incident.title}</p>
                      {incident.isActive && (
                        <span className="text-[10px] font-mono text-primary border border-primary/30 bg-primary/10 rounded-full px-2 py-0.5">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {incident.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() =>
                        updateIncident.mutate({ id: incident.id, isActive: !incident.isActive })
                      }
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={incident.isActive ? "Deactivate" : "Activate"}
                    >
                      {incident.isActive ? (
                        <ToggleRight className="w-6 h-6 text-primary" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-mono text-muted-foreground">Difficulty:</span>
                  {editingDiff?.id === incident.id ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-6 h-6 p-0 text-xs border-border"
                        onClick={() => setEditingDiff((e) => e ? { ...e, value: Math.max(2, e.value - 1) } : null)}
                      >−</Button>
                      <span className="font-mono text-sm text-foreground w-5 text-center">{editingDiff.value}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-6 h-6 p-0 text-xs border-border"
                        onClick={() => setEditingDiff((e) => e ? { ...e, value: Math.min(20, e.value + 1) } : null)}
                      >+</Button>
                      <Button
                        size="sm"
                        className="h-6 px-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                          updateIncident.mutate({ id: incident.id, difficulty: editingDiff.value });
                          setEditingDiff(null);
                        }}
                      >Save</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setEditingDiff(null)}
                      >Cancel</Button>
                    </div>
                  ) : (
                    <button
                      className="text-xs font-mono text-foreground hover:text-primary transition-colors underline decoration-dotted"
                      onClick={() => setEditingDiff({ id: incident.id, value: incident.difficulty })}
                    >
                      {incident.difficulty}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Operator Sheets ── */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-mono text-muted-foreground tracking-widest mb-3">OPERATOR FILES</p>
          {sheetsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !sheets || sheets.length === 0 ? (
            <div className="text-center py-10">
              <Shield className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No operators have clocked in yet.</p>
            </div>
          ) : (
            sheets.map((char) => (
              <div key={char.id} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{char.name}</p>
                    <p className="text-xs text-muted-foreground">{char.jobTitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-mono text-amber-400">{char.xp} XP</span>
                  </div>
                </div>
                <div className="space-y-1">
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
            ))
          )}
        </div>
      </div>

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
              <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">INCIDENT TITLE</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Unscheduled Biometric Enrollment"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">DESCRIPTION</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Describe the incident in detail. What happened? What's the complication?"
                className="bg-input border-border text-foreground min-h-[100px] resize-none"
              />
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1.5 block">DIFFICULTY (opposing roll)</Label>
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
