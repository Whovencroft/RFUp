import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { trpc } from "./lib/trpc";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OperatorFile from "./pages/OperatorFile";
import Sessions from "./pages/Sessions";
import Session from "./pages/Session";
import GmPanel from "./pages/GmPanel";
import Incidents from "./pages/Incidents";
import AdminSettings from "./pages/AdminSettings";

function Nav() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <nav style={{
      background: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border-subtle)",
      padding: "0 var(--space-lg)",
      height: "56px",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-sm)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
    }}>
      <Link to="/" style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        color: "var(--color-primary)",
        fontSize: "15px",
        letterSpacing: "0.04em",
        marginRight: "var(--space-sm)",
        textDecoration: "none",
      }}>
        {theme.settingShortName}
      </Link>

      <div style={{ flex: 1, display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
        {user && (
          <>
            <Link to="/sessions" className="nav-item-idle">{theme.sessionPluralLabel}</Link>
            <Link to="/incidents" className="nav-item-idle">{theme.incidentPluralLabel}</Link>
            <Link to="/operator" className="nav-item-idle">{theme.operatorFileLabel}</Link>
            {user.role === "admin" && (
              <>
                <Link to="/gm" className="nav-item-idle" style={{ color: "var(--color-tertiary)" }}>{theme.supervisorLabel}</Link>
                <Link to="/admin/settings" className="nav-item-idle">Settings</Link>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
        {!isLoading && !user && (
          <>
            <Link to="/login" className="btn btn-ghost" style={{ height: "36px", fontSize: "13px" }}>Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{ height: "36px", fontSize: "13px" }}>Register</Link>
          </>
        )}
        {user && (
          <>
            <span style={{ color: "var(--color-on-muted)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
              {user.displayName ?? user.username}
            </span>
            <button
              className="btn btn-ghost"
              style={{ height: "36px", fontSize: "13px" }}
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-neutral)" }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/operator" element={<ProtectedRoute><OperatorFile /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/sessions/:id" element={<ProtectedRoute><Session /></ProtectedRoute>} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/gm" element={<ProtectedRoute adminOnly><GmPanel /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
