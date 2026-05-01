import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Clock, CheckCircle, XCircle, Loader2, LogIn, AlertTriangle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Lobby() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: sessions, isLoading: sessionsLoading, refetch } = trpc.aiGm.listSessions.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const { data: myJoinRequests, refetch: refetchRequests } = trpc.joinRequests.pendingAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const requestJoin = trpc.joinRequests.request.useMutation({
    onSuccess: () => {
      toast.success("Join request sent! Waiting for Shift Supervisor approval.");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const respondToRequest = trpc.joinRequests.respond.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.status === "approved" ? "Operator approved." : "Request denied.");
      refetchRequests?.();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Enter the Facility</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to view active shifts and request to join a game.
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => (window.location.href = getLoginUrl())}
        >
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </div>
    );
  }

  const openSessions = sessions?.filter((s) => s.status === "active") ?? [];
  const endedSessions = sessions?.filter((s) => s.status === "ended") ?? [];

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Enter the Facility</h1>
              <p className="text-sm text-muted-foreground font-mono">FACILITY 404 — ACTIVE SHIFTS</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-3 max-w-2xl">
            Active shifts are listed below. Request to join a game — the Shift Supervisor will approve or deny your request.
            Once approved, you'll be added to the player roster.
          </p>
        </div>

        {/* GM: Pending join requests */}
        {user?.role === "admin" && myJoinRequests && myJoinRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Pending Join Requests
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border-amber-500/30 ml-1">
                {myJoinRequests.length}
              </Badge>
            </h2>
            <div className="space-y-2">
              {myJoinRequests.map((req) => (
                <Card key={req.id} className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{req.userName}</p>
                      {req.characterName && (
                        <p className="text-xs text-muted-foreground">Playing as: {req.characterName}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        Session #{req.sessionId} · {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30"
                        onClick={() => respondToRequest.mutate({ requestId: req.id, status: "approved" })}
                        disabled={respondToRequest.isPending}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => respondToRequest.mutate({ requestId: req.id, status: "denied" })}
                        disabled={respondToRequest.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Deny
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active sessions */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Active Shifts
            {openSessions.length > 0 && (
              <Badge variant="secondary" className="bg-green-500/15 text-green-400 border-green-500/30 ml-1">
                {openSessions.length}
              </Badge>
            )}
          </h2>

          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading active shifts...</span>
            </div>
          ) : openSessions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No active shifts right now.</p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Check back later or ask your Shift Supervisor to start a game.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {openSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  userId={user?.id}
                  isAdmin={user?.role === "admin"}
                  onRequestJoin={(id) => requestJoin.mutate({ sessionId: id })}
                  isRequesting={requestJoin.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Ended sessions */}
        {endedSessions.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-3 text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Past Shifts
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {endedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  userId={user?.id}
                  isAdmin={user?.role === "admin"}
                  onRequestJoin={() => {}}
                  isRequesting={false}
                  ended
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  userId,
  isAdmin,
  onRequestJoin,
  isRequesting,
  ended = false,
}: {
  session: {
    id: number;
    title: string;
    status: string;
    playerOrder: string | null;
    currentTurnUserId: number | null;
    createdAt: Date;
  };
  userId?: number;
  isAdmin: boolean;
  onRequestJoin: (id: number) => void;
  isRequesting: boolean;
  ended?: boolean;
}) {
  const playerOrder: number[] = JSON.parse(session.playerOrder ?? "[]");
  const isPlayer = userId !== undefined && playerOrder.includes(userId);

  const { data: myRequest } = trpc.joinRequests.myStatus.useQuery(
    { sessionId: session.id },
    { enabled: !isPlayer && !isAdmin && !ended }
  );

  const hasPendingRequest = myRequest?.status === "pending";
  const wasApproved = myRequest?.status === "approved";

  return (
    <Card className={cn(
      "transition-colors",
      ended ? "opacity-60" : "hover:border-primary/30"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-display leading-tight">{session.title}</CardTitle>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] flex-shrink-0",
              ended
                ? "bg-muted/50 text-muted-foreground"
                : "bg-green-500/15 text-green-400 border-green-500/30"
            )}
          >
            {ended ? "ENDED" : "ACTIVE"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {playerOrder.length} operator{playerOrder.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Action button */}
        {isPlayer || isAdmin ? (
          <Link href={`/sessions/${session.id}`}>
            <Button size="sm" className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
              {isAdmin ? "Open Session" : "Enter Shift"}
            </Button>
          </Link>
        ) : ended ? (
          <Link href={`/sessions/${session.id}`}>
            <Button size="sm" variant="outline" className="w-full">
              View Debrief
            </Button>
          </Link>
        ) : hasPendingRequest ? (
          <Button size="sm" variant="outline" className="w-full" disabled>
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Request Pending...
          </Button>
        ) : wasApproved ? (
          <Link href={`/sessions/${session.id}`}>
            <Button size="sm" className="w-full bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Approved — Enter Shift
            </Button>
          </Link>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full hover:border-primary/40 hover:text-primary"
            onClick={() => onRequestJoin(session.id)}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Shield className="w-3.5 h-3.5 mr-1.5" />
            )}
            Request to Join
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
