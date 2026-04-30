import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ChevronRight, Clock, CheckCircle } from "lucide-react";

export default function Sessions() {
  const { user } = useAuth();
  const { data: sessions, isLoading } = trpc.aiGm.listSessions.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight">
              Active Shifts
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              AI-run play-by-post sessions at Facility 404
            </p>
          </div>
          {user?.role === "admin" && (
            <Link href="/gm">
              <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground gap-2">
                <Bot className="w-4 h-4" />
                Launch New Session
              </Button>
            </Link>
          )}
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground py-16 text-sm font-mono">
            Loading sessions…
          </div>
        )}

        {!isLoading && (!sessions || sessions.length === 0) && (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm font-mono">No sessions have been started yet.</p>
            {user?.role === "admin" && (
              <p className="text-xs text-muted-foreground mt-2">
                Go to the{" "}
                <Link href="/gm">
                  <span className="text-primary underline cursor-pointer">Shift Supervisor panel</span>
                </Link>{" "}
                to launch one.
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {sessions?.map((s) => {
            const playerOrder: number[] = JSON.parse(s.playerOrder || "[]");
            const isEnded = s.status === "ended";
            return (
              <Link key={s.id} href={`/sessions/${s.id}`}>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${
                      isEnded
                        ? "bg-muted border-border text-muted-foreground"
                        : "bg-primary/10 border-primary/30 text-primary"
                    }`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {playerOrder.length} operator{playerOrder.length !== 1 ? "s" : ""} ·{" "}
                        Started {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${
                        isEnded
                          ? "text-muted-foreground border-border"
                          : "text-primary border-primary/40 bg-primary/10"
                      }`}
                    >
                      {isEnded ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> ENDED</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> ACTIVE</>
                      )}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
