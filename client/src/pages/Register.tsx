import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { refetch } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");

  const register = trpc.auth.register.useMutation({
    onSuccess: () => {
      refetch();
      navigate("/operator");
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    register.mutate({
      username: form.username,
      email: form.email,
      password: form.password,
      displayName: form.displayName || undefined,
      inviteCode: form.inviteCode || undefined,
    });
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 52px)", padding: "2rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Create Account</h2>
          <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Join {theme.settingName} as a {theme.operatorLabel.toLowerCase()}
          </p>
          <p style={{ margin: "0.35rem 0 0", color: "var(--teal)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
            First account registered becomes the admin
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="operator_name"
              pattern="[a-zA-Z0-9_-]+"
              title="Letters, numbers, underscores, hyphens only"
              minLength={3}
              maxLength={32}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Display Name (optional)</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="How you appear in sessions"
              maxLength={64}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="operator@facility404.local"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </div>
          <div className="form-group">
            <label>Invite Code (if required)</label>
            <input
              type="text"
              value={form.inviteCode}
              onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
              placeholder="XXXX-XXXX"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
            />
          </div>

          {error && (
            <div style={{ color: "var(--red)", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "rgba(255,77,106,0.1)", borderRadius: "6px" }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={register.isPending}>
            {register.isPending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--teal)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
