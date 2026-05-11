import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

// ─── Shared helpers ───────────────────────────────────────────────────────────
function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: ok ? "var(--teal)" : "var(--red, #ef4444)", marginRight: "0.4rem",
    }} />
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── LLM constants ────────────────────────────────────────────────────────────
const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI (GPT-4o, GPT-4o-mini, etc.)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "ollama", label: "Ollama (local, no API key needed)" },
  { value: "openai-compat", label: "OpenAI-compatible (LM Studio, Groq, Together, etc.)" },
  { value: "none", label: "Disabled — Supervisor-only mode" },
] as const;

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  ollama: "llama3",
  "openai-compat": "",
  none: "",
};

const IMAGE_PROVIDERS = [
  { value: "openai", label: "OpenAI (DALL-E 3)" },
  { value: "stability", label: "Stability AI" },
  { value: "none", label: "Disabled" },
] as const;

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const theme = useTheme();
  const { data: users, refetch } = trpc.adminUsers.listUsers.useQuery();
  const updateUser = trpc.adminUsers.updateUser.useMutation({ onSuccess: () => refetch() });
  const resetPw = trpc.adminUsers.resetPassword.useMutation();
  const [resetTarget, setResetTarget] = useState<{ id: number; username: string } | null>(null);
  const [newPw, setNewPw] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  return (
    <SectionCard title={`${theme.operatorPluralLabel} & ${theme.supervisorPluralLabel}`}>
      {!users?.length && <p style={{ color: "var(--text-dim)" }}>No users found.</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Username</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Email</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Role</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Last Login</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle, #1e293b)", opacity: u.isActive ? 1 : 0.6 }}>
                <td style={{ padding: "8px" }}>{u.displayName || u.username}</td>
                <td style={{ padding: "8px", color: "var(--text-muted)", fontSize: "0.8rem" }}>{u.email}</td>
                <td style={{ padding: "8px" }}>
                  <span style={{
                    background: u.role === "admin" ? "var(--purple-muted, #4c1d95)" : "var(--blue-muted, #1e3a5f)",
                    color: "#e2e8f0", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: "8px" }}>
                  <span style={{
                    background: u.isActive ? "var(--teal-muted, #065f46)" : "var(--red-muted, #7f1d1d)",
                    color: "#e2e8f0", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                  }}>{u.isActive ? "Active" : "Disabled"}</span>
                </td>
                <td style={{ padding: "8px", color: "var(--text-dim)", fontSize: "0.75rem" }}>
                  {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString() : "Never"}
                </td>
                <td style={{ padding: "8px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => updateUser.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                      className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }}>
                      {u.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button onClick={() => updateUser.mutate({ userId: u.id, isActive: !u.isActive })}
                      className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 8px", color: u.isActive ? "var(--red, #ef4444)" : "var(--teal)" }}>
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => { setResetTarget({ id: u.id, username: u.username }); setNewPw(""); setResetMsg(""); }}
                      className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }}>
                      Reset PW
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetTarget && (
        <div style={{ marginTop: 16, padding: 16, background: "var(--bg-muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: 8, fontSize: "0.875rem" }}>
            Reset password for <strong>{resetTarget.username}</strong>
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="password" placeholder="New password (min 8 chars)" value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              style={{ flex: 1, padding: "6px 10px", background: "var(--bg-input, #1e293b)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)", fontSize: 13 }} />
            <button onClick={async () => {
              await resetPw.mutateAsync({ userId: resetTarget.id, newPassword: newPw });
              setResetMsg("Password reset successfully.");
              setResetTarget(null);
            }} disabled={newPw.length < 8} className="btn btn-primary" style={{ fontSize: 13 }}>
              Save
            </button>
            <button onClick={() => setResetTarget(null)} className="btn btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
          </div>
          {resetMsg && <p style={{ color: "var(--teal)", marginTop: 8, fontSize: 13 }}>{resetMsg}</p>}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Invites Tab ──────────────────────────────────────────────────────────────
function InvitesTab() {
  const { data: invites, refetch } = trpc.adminUsers.listRegistrationInvites.useQuery();
  const createInvite = trpc.adminUsers.createRegistrationInvite.useMutation({ onSuccess: () => refetch() });
  const revokeInvite = trpc.adminUsers.revokeInvite.useMutation({ onSuccess: () => refetch() });
  const [hours, setHours] = useState("72");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const handleCreate = async () => {
    const result = await createInvite.mutateAsync({ expiresInHours: hours ? parseInt(hours) : undefined });
    setNewCode(result.code);
    setCopied(false);
  };

  return (
    <SectionCard title="Registration Invites">
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <label style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Expires in (hours):
          <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} min={1} max={720}
            style={{ marginLeft: 8, width: 80, padding: "5px 8px", background: "var(--bg-input, #1e293b)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)", fontSize: 13 }} />
        </label>
        <button onClick={handleCreate} className="btn btn-primary" style={{ fontSize: 13 }}>
          + Generate Invite Link
        </button>
      </div>

      {newCode && (
        <div style={{ padding: 12, background: "var(--bg-muted)", borderRadius: 6, border: "1px solid var(--teal-muted)", marginBottom: 16 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>New invite link (share this):</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ flex: 1, color: "var(--teal)", fontSize: 12, wordBreak: "break-all" }}>
              {origin}/register?invite={newCode}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(`${origin}/register?invite=${newCode}`); setCopied(true); }}
              className="btn btn-ghost" style={{ fontSize: 12 }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Code</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Created</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Expires</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invites?.map((inv) => {
              const expired = inv.expiresAt && new Date(inv.expiresAt) < new Date();
              const used = !!inv.usedAt;
              return (
                <tr key={inv.id} style={{ borderBottom: "1px solid var(--border-subtle, #1e293b)" }}>
                  <td style={{ padding: "8px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                    {inv.code.slice(0, 12)}...
                  </td>
                  <td style={{ padding: "8px", color: "var(--text-dim)", fontSize: 12 }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "8px", color: expired ? "var(--red, #ef4444)" : "var(--text-dim)", fontSize: 12 }}>
                    {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td style={{ padding: "8px" }}>
                    <span style={{
                      background: used ? "var(--teal-muted, #065f46)" : expired ? "var(--red-muted, #7f1d1d)" : "var(--blue-muted, #1e3a5f)",
                      color: "#e2e8f0", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                    }}>{used ? "Used" : expired ? "Expired" : "Active"}</span>
                  </td>
                  <td style={{ padding: "8px" }}>
                    {!used && (
                      <button onClick={() => revokeInvite.mutate({ inviteId: inv.id })}
                        className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 8px", color: "var(--red, #ef4444)" }}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!invites?.length && (
              <tr><td colSpan={5} style={{ color: "var(--text-dim)", padding: 12, textAlign: "center" }}>No invites yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ─── LLM Tab ──────────────────────────────────────────────────────────────────
function LLMTab() {
  const { data: currentSettings, refetch } = trpc.admin.getSettings.useQuery();
  const { data: llmStatus } = trpc.admin.llmStatus.useQuery();
  const updateLLM = trpc.admin.updateLLM.useMutation({ onSuccess: () => { refetch(); setLlmSaved(true); setTimeout(() => setLlmSaved(false), 3000); } });
  const updateImage = trpc.admin.updateImage.useMutation({ onSuccess: () => { refetch(); setImgSaved(true); setTimeout(() => setImgSaved(false), 3000); } });
  const updateSecurity = trpc.admin.updateSecurity.useMutation({ onSuccess: () => { refetch(); setSecSaved(true); setTimeout(() => setSecSaved(false), 3000); } });
  const testLLM = trpc.admin.testLLM.useMutation();
  const listOllamaModels = trpc.admin.listOllamaModels.useMutation({
    onSuccess: (data) => { if (data.success) { setOllamaModels(data.models); setOllamaError(null); } else { setOllamaError(data.error ?? "Could not fetch models"); } },
  });

  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [llmBaseUrl, setLlmBaseUrl] = useState("");
  const [imgProvider, setImgProvider] = useState("none");
  const [imgApiKey, setImgApiKey] = useState("");
  const [imgModel, setImgModel] = useState("");
  const [requireInvite, setRequireInvite] = useState(false);
  const [llmSaved, setLlmSaved] = useState(false);
  const [imgSaved, setImgSaved] = useState(false);
  const [secSaved, setSecSaved] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentSettings) return;
    setLlmProvider(currentSettings.llm_provider ?? "openai");
    setLlmApiKey(currentSettings.llm_api_key ?? "");
    setLlmModel(currentSettings.llm_model ?? "");
    setLlmBaseUrl(currentSettings.llm_base_url ?? "");
    setImgProvider(currentSettings.image_provider ?? "none");
    setImgApiKey(currentSettings.image_api_key ?? "");
    setImgModel(currentSettings.image_model ?? "");
    setRequireInvite(currentSettings.require_invite === "true");
  }, [currentSettings]);

  const needsApiKey = llmProvider === "openai" || llmProvider === "anthropic" || llmProvider === "openai-compat";
  const needsBaseUrl = llmProvider === "ollama" || llmProvider === "openai-compat";
  const imgNeedsKey = imgProvider === "openai" || imgProvider === "stability";

  return (
    <>
      <div style={{
        padding: "0.75rem 1rem", background: "var(--bg-card)", border: `1px solid ${llmStatus?.isConfigured ? "var(--teal-muted)" : "var(--border)"}`,
        borderRadius: 8, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem",
      }}>
        <StatusDot ok={!!llmStatus?.isConfigured} />
        {llmStatus?.isConfigured ? `AI GM active: ${llmStatus.provider} / ${llmStatus.model}` : "AI GM inactive — supervisor-only mode."}
      </div>

      <SectionCard title="AI Game Master (LLM)">
        <form onSubmit={(e) => { e.preventDefault(); updateLLM.mutate({ provider: llmProvider as any, apiKey: llmApiKey, model: llmModel || DEFAULT_MODELS[llmProvider] || undefined, baseUrl: llmBaseUrl || undefined }); }}>
          <div className="form-group">
            <label>Provider</label>
            <select value={llmProvider} onChange={(e) => { setLlmProvider(e.target.value); setLlmModel(DEFAULT_MODELS[e.target.value] ?? ""); }}>
              {LLM_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {needsApiKey && (
            <div className="form-group">
              <label>API Key</label>
              <input type="password" value={llmApiKey} onChange={(e) => setLlmApiKey(e.target.value)}
                placeholder={llmApiKey.startsWith("••••") ? "Leave blank to keep existing key" : "sk-..."} autoComplete="new-password" />
            </div>
          )}
          {needsBaseUrl && (
            <div className="form-group">
              <label>Base URL</label>
              <input value={llmBaseUrl} onChange={(e) => setLlmBaseUrl(e.target.value)}
                placeholder={llmProvider === "ollama" ? "http://localhost:11434/v1" : "https://api.example.com/v1"} />
            </div>
          )}
          <div className="form-group">
            <label>Model</label>
            {llmProvider === "ollama" && ollamaModels.length > 0 ? (
              <>
                <select value={llmModel} onChange={(e) => setLlmModel(e.target.value)} style={{ marginBottom: "0.4rem" }}>
                  <option value="">— select a model —</option>
                  {ollamaModels.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <button type="button" className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }} onClick={() => { setOllamaModels([]); setLlmModel(""); }}>X Clear</button>
              </>
            ) : (
              <>
                <input value={llmModel} onChange={(e) => setLlmModel(e.target.value)} placeholder={DEFAULT_MODELS[llmProvider] || "model name"} />
                {llmProvider === "ollama" && (
                  <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button type="button" className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
                      disabled={listOllamaModels.isPending} onClick={() => { setOllamaError(null); listOllamaModels.mutate(); }}>
                      {listOllamaModels.isPending ? "Fetching..." : "Fetch available models"}
                    </button>
                    {ollamaError && <span style={{ fontSize: "0.75rem", color: "var(--red, #ef4444)" }}>{ollamaError}</span>}
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={updateLLM.isPending}>{updateLLM.isPending ? "Saving..." : "Save LLM Settings"}</button>
            <button type="button" className="btn btn-ghost" disabled={testLLM.isPending || !llmStatus?.isConfigured} onClick={() => testLLM.mutate()}>
              {testLLM.isPending ? "Testing..." : "Test Connection"}
            </button>
            {llmSaved && <span style={{ color: "var(--teal)", fontSize: "0.8rem" }}>Saved</span>}
          </div>
          {testLLM.data && (
            <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--bg-muted)", borderRadius: 6, fontSize: "0.8rem", fontFamily: "var(--font-mono)", borderLeft: `3px solid ${testLLM.data.success ? "var(--teal)" : "var(--red, #ef4444)"}` }}>
              <StatusDot ok={testLLM.data.success} />
              {testLLM.data.success ? "Connection successful" : "Connection failed"}
              {testLLM.data.message && <div style={{ marginTop: "0.35rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{testLLM.data.message}</div>}
            </div>
          )}
        </form>
      </SectionCard>

      <SectionCard title="Portrait Generation (Image AI)">
        <form onSubmit={(e) => { e.preventDefault(); updateImage.mutate({ provider: imgProvider as any, apiKey: imgApiKey, model: imgModel || undefined }); }}>
          <div className="form-group">
            <label>Provider</label>
            <select value={imgProvider} onChange={(e) => setImgProvider(e.target.value)}>
              {IMAGE_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {imgNeedsKey && (
            <div className="form-group">
              <label>API Key</label>
              <input type="password" value={imgApiKey} onChange={(e) => setImgApiKey(e.target.value)}
                placeholder={imgApiKey.startsWith("••••") ? "Leave blank to keep existing key" : "sk-..."} autoComplete="new-password" />
            </div>
          )}
          {imgProvider !== "none" && (
            <div className="form-group">
              <label>Model (optional)</label>
              <input value={imgModel} onChange={(e) => setImgModel(e.target.value)}
                placeholder={imgProvider === "openai" ? "dall-e-3" : "stable-diffusion-xl-1024-v1-0"} />
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={updateImage.isPending}>{updateImage.isPending ? "Saving..." : "Save Image Settings"}</button>
            {imgSaved && <span style={{ color: "var(--teal)", fontSize: "0.8rem" }}>Saved</span>}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Security">
        <form onSubmit={(e) => { e.preventDefault(); updateSecurity.mutate({ requireInvite }); }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <input type="checkbox" id="require-invite" checked={requireInvite} onChange={(e) => setRequireInvite(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="require-invite" style={{ cursor: "pointer", fontSize: "0.875rem" }}>Require invite code for new registrations</label>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={updateSecurity.isPending}>{updateSecurity.isPending ? "Saving..." : "Save Security Settings"}</button>
            {secSaved && <span style={{ color: "var(--teal)", fontSize: "0.8rem" }}>Saved</span>}
          </div>
        </form>
      </SectionCard>
    </>
  );
}

// ─── Theme Tab ────────────────────────────────────────────────────────────────
const THEME_FIELD_GROUPS: { label: string; fields: string[] }[] = [
  { label: "Identity", fields: ["gameName", "tagline", "settingName", "settingShortName", "welcomeMessage"] },
  { label: "Character Labels", fields: ["operatorLabel", "operatorPluralLabel", "operatorFileLabel", "supervisorLabel", "supervisorPluralLabel", "defaultJobTitle"] },
  { label: "Gameplay Labels", fields: ["skillLabel", "skillPluralLabel", "xpLabel", "xpFullLabel", "incidentLabel", "incidentPluralLabel", "sessionLabel", "sessionPluralLabel", "actionLabel", "rollLabel"] },
  { label: "Status & Actions", fields: ["activeStatusLabel", "inactiveStatusLabel", "joinLabel", "leaveLabel", "commendationLabel", "commendationPluralLabel"] },
  { label: "AI Game Master", fields: ["aiGmName", "aiGmDescription"] },
  { label: "Colors", fields: ["accentColor", "accentColorDark"] },
];

function ThemeTab() {
  const { data: currentTheme, refetch: refetchTheme } = trpc.theme.getTheme.useQuery();
  const { data: presets } = trpc.theme.listPresets.useQuery();
  const applyPreset = trpc.theme.applyPreset.useMutation({ onSuccess: () => refetchTheme() });
  const updateTheme = trpc.theme.updateTheme.useMutation({ onSuccess: () => { refetchTheme(); setSaved(true); setTimeout(() => setSaved(false), 2500); } });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentTheme) setFields(currentTheme as unknown as Record<string, string>);
  }, [currentTheme]);

  const setField = (key: string, val: string) => setFields((f) => ({ ...f, [key]: val }));

  return (
    <>
      <SectionCard title="Preset Themes">
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: 12 }}>
          Select a preset to load all labels and colors for that game setting. Customize individual fields below.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {presets?.map((p) => (
            <button key={p.key} onClick={() => applyPreset.mutate({ presetKey: p.key })}
              style={{
                padding: "10px 18px", background: "var(--bg-card)", border: `2px solid ${p.accentColor || "var(--border)"}`,
                borderRadius: 8, color: "var(--text)", cursor: "pointer", textAlign: "left", minWidth: 160,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: p.accentColor || "#888", display: "inline-block" }} />
                <strong style={{ fontSize: 13 }}>{p.gameName}</strong>
              </div>
              <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 4 }}>{p.tagline}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      {THEME_FIELD_GROUPS.map((group) => (
        <SectionCard key={group.label} title={group.label}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px 20px" }}>
            {group.fields.map((key) => (
              <label key={key} style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                {key.includes("Color") ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                    <input type="color" value={fields[key] ?? "#14b8a6"} onChange={(e) => setField(key, e.target.value)}
                      style={{ width: 36, height: 30, border: "none", background: "none", cursor: "pointer", padding: 0 }} />
                    <input type="text" value={fields[key] ?? ""} onChange={(e) => setField(key, e.target.value)}
                      style={{ flex: 1, padding: "5px 8px", background: "var(--bg-input, #1e293b)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)", fontSize: 12 }} />
                  </div>
                ) : (
                  <input type="text" value={fields[key] ?? ""} onChange={(e) => setField(key, e.target.value)}
                    style={{ display: "block", marginTop: 4, width: "100%", padding: "5px 8px", background: "var(--bg-input, #1e293b)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
                )}
              </label>
            ))}
          </div>
        </SectionCard>
      ))}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 32 }}>
        <button onClick={() => updateTheme.mutateAsync(fields)} className="btn btn-primary" style={{ fontSize: 14 }}>
          Save Theme
        </button>
        {saved && <span style={{ color: "var(--teal)", fontSize: 13 }}>Saved</span>}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = "users" | "invites" | "llm" | "theme";

export default function AdminSettings() {
  const { user } = useAuth();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("users");

  if (user && user.role !== "admin") return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/login" replace />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "users", label: theme.operatorPluralLabel || "Users" },
    { id: "invites", label: "Invites" },
    { id: "llm", label: "AI & LLM" },
    { id: "theme", label: "Game Theme" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: 0 }}>Admin Settings</h2>
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          {theme.settingName} Administration Panel. Changes take effect immediately.
        </p>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "8px 18px", background: "transparent",
              color: tab === t.id ? "var(--teal)" : "var(--text-muted)",
              border: "none", borderBottom: tab === t.id ? "2px solid var(--teal)" : "2px solid transparent",
              cursor: "pointer", fontSize: 14, fontWeight: tab === t.id ? 600 : 400, marginBottom: -1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "invites" && <InvitesTab />}
      {tab === "llm" && <LLMTab />}
      {tab === "theme" && <ThemeTab />}
    </div>
  );
}
