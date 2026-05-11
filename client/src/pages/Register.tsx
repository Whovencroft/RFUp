import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { refetch } = useAuth();
  const [searchParams] = useSearchParams();

  // Pre-fill invite code from ?invite= URL param
  const urlInvite = searchParams.get("invite") ?? "";

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
    inviteCode: urlInvite,
  });
  const [error, setError] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteValid, setInviteValid] = useState<boolean | null>(urlInvite ? null : null);

  // When the URL invite code changes (e.g. direct navigation), sync it into the form
  useEffect(() => {
    if (urlInvite) {
      setForm((f) => ({ ...f, inviteCode: urlInvite }));
    }
  }, [urlInvite]);

  // Validate invite code on the server whenever the field changes (debounced)
  const validateInviteQuery = trpc.adminUsers.validateInvite.useQuery(
    { code: form.inviteCode },
    {
      enabled: form.inviteCode.length > 0,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    }
  );

  // Sync validation result into local state
  useEffect(() => {
    if (!form.inviteCode) {
      setInviteValid(null);
      setInviteError(null);
      return;
    }
    if (validateInviteQuery.data) {
      setInviteValid(validateInviteQuery.data.valid);
      setInviteError(validateInviteQuery.data.valid ? null : (validateInviteQuery.data.reason ?? "Invalid invite code."));
    }
  }, [validateInviteQuery.data, form.inviteCode]);

  const register = trpc.auth.register.useMutation({
    onSuccess: () => {
      refetch();
      navigate("/operator");
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.inviteCode && inviteValid === false) {
      setError(inviteError ?? "Invalid invite code.");
      return;
    }
    setError("");
    register.mutate({
      username: form.username,
      email: form.email,
      password: form.password,
      displayName: form.displayName || undefined,
      inviteCode: form.inviteCode || undefined,
    });
  };

  const codeFieldBorderColor = form.inviteCode
    ? inviteValid === true
      ? "var(--teal)"
      : inviteValid === false
      ? "var(--red)"
      : "var(--border)"
    : "var(--border)";

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 52px)", padding: "2rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Create Account</h2>
          <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Join {theme.settingName} as a {theme.operatorLabel.toLowerCase()}
          </p>
          {!urlInvite && (
            <p style={{ margin: "0.35rem 0 0", color: "var(--teal)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
              First account registered becomes the admin
            </p>
          )}
        </div>

        {/* Invite banner — shown when arriving via invite link */}
        {urlInvite && (
          <div style={{
            marginBottom: "1.25rem",
            padding: "0.6rem 0.85rem",
            borderRadius: "6px",
            background: inviteValid === false ? "rgba(255,77,106,0.1)" : "rgba(20,184,166,0.1)",
            border: `1px solid ${inviteValid === false ? "var(--red)" : "var(--teal-muted)"}`,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            color: inviteValid === false ? "var(--red)" : "var(--teal)",
          }}>
            <span>{inviteValid === false ? "✗" : "✓"}</span>
            <span>
              {inviteValid === false
                ? inviteError ?? "Checking invite…"
                : validateInviteQuery.isLoading
                ? "Validating invite code…"
                : "Invite code pre-filled and verified. You're good to go."}
            </span>
          </div>
        )}

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
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              Invite Code {form.inviteCode && inviteValid === true && (
                <span style={{ color: "var(--teal)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>✓ valid</span>
              )}
            </label>
            <input
              type="text"
              value={form.inviteCode}
              onChange={(e) => {
                setForm({ ...form, inviteCode: e.target.value });
                setInviteValid(null);
                setInviteError(null);
              }}
              placeholder="Paste invite code here"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
                borderColor: codeFieldBorderColor,
                transition: "border-color 0.15s",
              }}
            />
            {inviteError && (
              <div style={{ color: "var(--red)", fontSize: "0.8rem", marginTop: "0.25rem" }}>{inviteError}</div>
            )}
          </div>

          {error && (
            <div style={{ color: "var(--red)", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "rgba(255,77,106,0.1)", borderRadius: "6px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={register.isPending || (form.inviteCode.length > 0 && inviteValid === false)}
          >
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
