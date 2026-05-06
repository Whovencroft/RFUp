import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
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
  const navigate = useNavigate();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <nav style={{
      background: "var(--bg-card)",
      borderBottom: "1px solid var(--border)",
      padding: "0 1.5rem",
      height: "52px",
      display: "flex",
      alignItems: "center",
      gap: "1.5rem",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--teal)", fontSize: "1rem", letterSpacing: "0.05em" }}>
        FACILITY 404
      </Link>

      <div style={{ flex: 1, display: "flex", gap: "1rem", alignItems: "center" }}>
        {user && (
          <>
            <Link to="/sessions" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Sessions</Link>
            <Link to="/incidents" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Incidents</Link>
            <Link to="/operator" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Operator File</Link>
            {user.role === "admin" && (
              <>
                <Link to="/gm" style={{ color: "var(--teal)", fontSize: "0.875rem" }}>Shift Supervisor</Link>
                <Link to="/admin/settings" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Settings</Link>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        {!isLoading && !user && (
          <>
            <Link to="/login" className="btn btn-ghost" style={{ padding: "0.35rem 0.75rem" }}>Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: "0.35rem 0.75rem" }}>Register</Link>
          </>
        )}
        {user && (
          <>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
              {user.displayName ?? user.username}
            </span>
            <button
              className="btn btn-ghost"
              style={{ padding: "0.35rem 0.75rem" }}
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
