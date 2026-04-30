import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Shield, Dices, AlertTriangle, ScrollText, Settings, LogIn, LogOut, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Shield },
  { href: "/play", label: "Play", icon: Dices },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/sessions", label: "AI Sessions", icon: Bot },
  { href: "/log", label: "Session Log", icon: ScrollText },
];

export default function NavBar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => window.location.reload() });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-semibold text-sm tracking-wide text-foreground">
            Roll for Uptime
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
            FACILITY 404
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  location === href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/gm">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  location === "/gm"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                )}
              >
                <Settings className="w-3.5 h-3.5" />
                Shift Supervisor
              </button>
            </Link>
          )}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-muted-foreground font-mono">
                {user?.name ?? user?.email ?? "Operator"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8"
                onClick={() => logout.mutate()}
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
