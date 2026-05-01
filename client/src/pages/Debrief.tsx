import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronLeft,
  FileText,
  Shield,
  Clock,
  Users,
  Loader2,
  Download,
} from "lucide-react";

export default function Debrief() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const { data: session, isLoading } = trpc.aiGm.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const { data: messages } = trpc.aiGm.getMessages.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const endSession = trpc.aiGm.endSession.useMutation({
    onSuccess: () => {
      toast.success("Shift ended and debrief generated.");
    },
    onError: (e) => toast.error(e.message),
  });

  const isAdmin = user?.role === "admin";
  const isEnded = session?.status === "ended";

  const handleExportPdf = () => {
    setExporting(true);
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono text-sm">
        Session not found.
      </div>
    );
  }

  const playerOrder: number[] = JSON.parse(session.playerOrder || "[]");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/sessions/${sessionId}`}>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7 px-2">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-xs font-mono">Back to Session</span>
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">
                Incident Report — {session.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && !isEnded && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-400/10"
                disabled={endSession.isPending}
                onClick={() => endSession.mutate({ sessionId })}
              >
                {endSession.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Shield className="w-3 h-3" />
                )}
                End Shift & Generate Debrief
              </Button>
            )}
            {isEnded && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs gap-1.5"
                disabled={exporting}
                onClick={handleExportPdf}
              >
                <Download className="w-3 h-3" />
                Export PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Report header */}
        <div className="text-center space-y-2 print:space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border" />
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-xs font-mono text-muted-foreground tracking-widest">FACILITY 404 — POST-INCIDENT REPORT</p>
          <h2 className="text-3xl font-display font-bold text-foreground">{session.title}</h2>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono mt-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {new Date(session.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {playerOrder.length} operator{playerOrder.length !== 1 ? "s" : ""}
            </span>
            <Badge
              variant="outline"
              className={`text-xs font-mono ${isEnded ? "text-muted-foreground border-border" : "text-primary border-primary/40"}`}
            >
              {isEnded ? "SHIFT CLOSED" : "SHIFT ACTIVE"}
            </Badge>
          </div>
        </div>

        {/* Debrief content */}
        {isEnded && session.debriefContent ? (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <p className="text-xs font-mono text-primary tracking-widest">OFFICIAL DEBRIEF</p>
            <div className="prose prose-sm prose-invert max-w-none">
              {session.debriefContent.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        ) : isEnded ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm font-mono">
            No debrief content available for this session.
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center space-y-3">
            <Shield className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm text-amber-400 font-mono">Shift still in progress</p>
            <p className="text-xs text-muted-foreground">
              The Shift Supervisor can end the shift from this page to generate the official post-incident debrief.
            </p>
          </div>
        )}

        {/* Session transcript */}
        {messages && messages.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <p className="text-xs font-mono text-primary tracking-widest">SHIFT TRANSCRIPT</p>
            <div className="space-y-3 max-h-96 overflow-y-auto print:max-h-none">
              {messages.map((msg) => {
                const rollData = msg.rollData ? JSON.parse(msg.rollData) : null;
                const isAi = msg.authorType === "ai";
                const isGm = msg.authorType === "gm";
                return (
                  <div key={msg.id} className="text-xs border-b border-border/30 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-mono font-semibold ${isAi ? "text-primary" : isGm ? "text-amber-400" : "text-foreground"}`}>
                        {msg.authorName}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {rollData && (
                        <span className="text-muted-foreground font-mono">
                          [{rollData.skillName} {rollData.skillLevel} → {rollData.dice.join(",")} = {rollData.total}]
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{msg.content}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; color: black; }
          .bg-card { background: #f9f9f9 !important; }
          .text-foreground { color: black !important; }
          .text-muted-foreground { color: #555 !important; }
          .border-border { border-color: #ccc !important; }
        }
      `}</style>
    </div>
  );
}
