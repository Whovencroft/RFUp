import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Shield, Dices, AlertTriangle, ScrollText, Settings,
  LogIn, LogOut, Bot, Menu, X, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const publicNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/lobby", label: "Enter the Facility", icon: Shield },
  { href: "/play", label: "Operator File", icon: Dices },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/sessions", label: "AI Sessions", icon: Bot },
];

const adminNavItems = [
  { href: "/log", label: "Session Log", icon: ScrollText },
];

export default function NavBar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => window.location.reload() });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isAdmin = user?.role === "admin";

  const NavLink = ({ href, label, icon: Icon, amber = false }: { href: string; label: string; icon: React.ElementType; amber?: boolean }) => (
    <Link href={href}>
      <button
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors w-full text-left",
          location === href
            ? amber ? "bg-amber-500/15 text-amber-400" : "bg-primary/15 text-primary"
            : amber
              ? "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {label}
      </button>
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="w-7 h-7 flex-shrink-0 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-sm tracking-wide text-foreground truncate">
              Roll for Uptime
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 flex-shrink-0">
              FACILITY 404
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {publicNavItems.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} />
            ))}
            {isAdmin && adminNavItems.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} />
            ))}
            {isAdmin && (
              <NavLink href="/gm" label="Shift Supervisor" icon={Settings} amber />
            )}
          </nav>

          {/* Right side: auth + hamburger */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="hidden md:block text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                  {user?.name ?? user?.email ?? "Operator"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex text-muted-foreground hover:text-foreground h-8"
                  onClick={() => logout.mutate()}
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="hidden md:flex h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Sign in
              </Button>
            )}

            {/* Hamburger — visible on mobile/tablet */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-card border-l border-border flex flex-col transition-transform duration-300 lg:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
          <span className="font-display font-semibold text-sm tracking-wide">Navigation</span>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {publicNavItems.map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon} />
          ))}
          {isAdmin && (
            <>
              <div className="border-t border-border my-2" />
              {adminNavItems.map(({ href, label, icon }) => (
                <NavLink key={href} href={href} label={label} icon={icon} />
              ))}
              <NavLink href="/gm" label="Shift Supervisor" icon={Settings} amber />
            </>
          )}
        </nav>

        {/* Drawer auth section */}
        <div className="border-t border-border px-4 py-4 flex-shrink-0">
          {isAuthenticated ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono truncate">
                {user?.name ?? user?.email ?? "Operator"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => logout.mutate()}
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
