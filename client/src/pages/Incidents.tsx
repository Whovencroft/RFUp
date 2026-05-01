import { trpc } from "@/lib/trpc";
import { AlertTriangle, Shield, Lock, Eye, Wifi, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const difficultyLabel = (d: number) => {
  if (d <= 5) return { label: "LOW", color: "text-primary border-primary/30 bg-primary/10" };
  if (d <= 7) return { label: "MODERATE", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" };
  if (d <= 9) return { label: "HIGH", color: "text-orange-400 border-orange-400/30 bg-orange-400/10" };
  return { label: "CRITICAL", color: "text-destructive border-destructive/30 bg-destructive/10" };
};

const categoryIcon = (title: string) => {
  if (/badge|access|biometric/i.test(title)) return Lock;
  if (/camera|surveillance|blind/i.test(title)) return Eye;
  if (/network|device|rogue/i.test(title)) return Wifi;
  if (/vendor|visitor|contractor/i.test(title)) return Users;
  return Shield;
};

export default function Incidents() {
  const { data: incidents, isLoading } = trpc.incidents.active.useQuery();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <p className="text-xs font-mono text-primary mb-2 tracking-widest">FACILITY 404</p>
        <h1 className="text-3xl font-display font-semibold text-foreground mb-2">Incident Board</h1>
        <p className="text-muted-foreground text-sm max-w-xl">
          Active security incidents currently posted by the Shift Supervisor. 
          Each incident includes a difficulty rating for the opposing roll.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !incidents || incidents.length === 0 ? (
        <div className="text-center py-20">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No active incidents. Either the facility is secure, or something is very wrong.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">The Shift Supervisor will post incidents when a session begins.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {incidents.map((incident) => {
            const diff = difficultyLabel(incident.difficulty);
            const Icon = categoryIcon(incident.title);
            return (
              <div
                key={incident.id}
                className="p-5 rounded-xl border border-primary/40 bg-primary/5 transition-all hover:border-primary/60 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-primary/20 border border-primary/30">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground leading-snug">{incident.title}</h3>
                        <span className="text-[10px] font-mono text-primary border border-primary/30 bg-primary/10 rounded-full px-2 py-0.5 animate-pulse">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className={cn("text-[10px] font-mono border rounded px-2 py-0.5", diff.color)}>
                      {diff.label}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-11">
                  {incident.description}
                </p>
                <div className="flex items-center gap-3 pl-11">
                  <span className="text-xs font-mono text-muted-foreground">
                    Difficulty: <span className="text-foreground">{incident.difficulty}</span>
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Roll {incident.difficulty + 1}+ to succeed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
