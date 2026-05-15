import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Login() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { refetch } = useAuth();
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [error, setError] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      refetch();
      navigate("/sessions");
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate(form);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 56px)", padding: "2rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Sign In</h2>
          <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Access your {theme.settingName} {theme.operatorLabel.toLowerCase()} account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input
              type="text"
              value={form.usernameOrEmail}
              onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
              placeholder="operator_name or email@example.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ color: "var(--color-error)", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "#fee2e2", borderRadius: "var(--radius-md)" }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No account?{" "}
          <Link to="/register" style={{ color: "var(--teal)" }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
