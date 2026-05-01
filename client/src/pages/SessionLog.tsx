import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ScrollText, Dices, Star, Zap, AlertTriangle, Loader2, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const eventConfig = {
  roll: { icon: Dices, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  skill_gained: { icon: Star, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  xp_awarded: { icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  xp_spent: { icon: Zap, color: "text-muted-foreground", bg: "bg-muted border-border" },
  incident_activated: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
} as const;

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function SessionLog() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: entries, isLoading, refetch, isFetching } = trpc.sessionLog.recent.useQuery(
    { limit: 100 },
    { refetchInterval: 8000, enabled: isAdmin }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-xs font-mono text-primary mb-2 tracking-widest">ACCESS DENIED</p>
          <h1 className="text-2xl font-display font-semibold text-foreground mb-3">Restricted Access</h1>
          <p className="text-muted-foreground text-sm">
            The Session Log is restricted to Shift Supervisors only. Contact your facility administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-mono text-primary mb-2 tracking-widest">FACILITY 404 — SHIFT SUPERVISOR</p>
          <h1 className="text-3xl font-display font-semibold text-foreground mb-2">Session Log</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            A real-time feed of all operator activity — dice rolls, skill advancements, XP changes, 
            and incident activations. Refreshes automatically every 8 seconds.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="text-center py-20">
          <ScrollText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No activity logged yet. Clock in and start rolling.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-2">
          {entries.map((entry, idx) => {
            const config = eventConfig[entry.eventType] ?? eventConfig.roll;
            const Icon = config.icon;
            let metadata: Record<string, unknown> | null = null;
            try { metadata = entry.metadata ? JSON.parse(entry.metadata) : null; } catch {}

            return (
              <div
                key={entry.id}
                className={cn(
                  "flex gap-3 p-4 rounded-lg border bg-card fade-in-up",
                  idx === 0 && "border-primary/20"
                )}
                style={{ animationDelay: `${Math.min(idx * 20, 200)}ms` }}
              >
                <div className={cn("w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{entry.description}</p>
                  {metadata && typeof metadata === "object" && "dice" in metadata && Array.isArray(metadata.dice) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(metadata.dice as number[]).map((d, i) => (
                        <span
                          key={i}
                          className={cn(
                            "text-xs font-mono px-1.5 py-0.5 rounded border",
                            d === 6
                              ? "text-primary border-primary/30 bg-primary/10"
                              : "text-muted-foreground border-border bg-muted"
                          )}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-muted-foreground">{formatTime(entry.createdAt)}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/60">{formatDate(entry.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
