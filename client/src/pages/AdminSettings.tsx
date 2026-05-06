import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";

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

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: ok ? "var(--teal)" : "var(--red, #ef4444)",
      marginRight: "0.4rem",
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

export default function AdminSettings() {
  const { user } = useAuth();

  // Redirect non-admins
  if (user && user.role !== "admin") return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/login" replace />;

  const { data: currentSettings, refetch } = trpc.admin.getSettings.useQuery();
  const { data: llmStatus } = trpc.admin.llmStatus.useQuery();

  const updateLLM = trpc.admin.updateLLM.useMutation({ onSuccess: () => { refetch(); setLlmSaved(true); setTimeout(() => setLlmSaved(false), 3000); } });
  const updateImage = trpc.admin.updateImage.useMutation({ onSuccess: () => { refetch(); setImgSaved(true); setTimeout(() => setImgSaved(false), 3000); } });
  const updateSecurity = trpc.admin.updateSecurity.useMutation({ onSuccess: () => { refetch(); setSecSaved(true); setTimeout(() => setSecSaved(false), 3000); } });
  const testLLM = trpc.admin.testLLM.useMutation();

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
  const listOllamaModels = trpc.admin.listOllamaModels.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setOllamaModels(data.models);
        setOllamaError(null);
      } else {
        setOllamaError(data.error ?? "Could not fetch models");
      }
    },
  });

  // Populate form from current settings
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
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: 0 }}>System Settings</h2>
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Admin-only. Changes take effect immediately without restarting the server.
        </p>
      </div>

      {/* LLM Status banner */}
      <div style={{
        padding: "0.75rem 1rem",
        background: "var(--bg-card)",
        border: `1px solid ${llmStatus?.isConfigured ? "var(--teal-muted)" : "var(--border)"}`,
        borderRadius: "8px",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.875rem",
      }}>
        <StatusDot ok={!!llmStatus?.isConfigured} />
        {llmStatus?.isConfigured
          ? `AI GM active: ${llmStatus.provider} / ${llmStatus.model}`
          : "AI GM inactive — supervisor-only mode. Configure a provider below to enable it."}
      </div>

      {/* ── LLM Configuration ─────────────────────────────────────────────── */}
      <SectionCard title="AI Game Master (LLM)">
        <form onSubmit={(e) => {
          e.preventDefault();
          updateLLM.mutate({
            provider: llmProvider as any,
            apiKey: llmApiKey,
            model: llmModel || DEFAULT_MODELS[llmProvider] || undefined,
            baseUrl: llmBaseUrl || undefined,
          });
        }}>
          <div className="form-group">
            <label>Provider</label>
            <select value={llmProvider} onChange={(e) => {
              setLlmProvider(e.target.value);
              setLlmModel(DEFAULT_MODELS[e.target.value] ?? "");
            }}>
              {LLM_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {needsApiKey && (
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={llmApiKey}
                onChange={(e) => setLlmApiKey(e.target.value)}
                placeholder={llmApiKey.startsWith("••••") ? "Leave blank to keep existing key" : "sk-..."}
                autoComplete="new-password"
              />
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                Leave blank to keep the existing key. Shown masked for security.
              </div>
            </div>
          )}

          {needsBaseUrl && (
            <div className="form-group">
              <label>Base URL</label>
              <input
                value={llmBaseUrl}
                onChange={(e) => setLlmBaseUrl(e.target.value)}
                placeholder={llmProvider === "ollama" ? "http://localhost:11434/v1" : "https://api.example.com/v1"}
              />
            </div>
          )}

          <div className="form-group">
            <label>Model</label>
            {/* Ollama: show a dropdown populated from the server, with a fetch button */}
            {llmProvider === "ollama" && ollamaModels.length > 0 ? (
              <>
                <select
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  style={{ marginBottom: "0.4rem" }}
                >
                  <option value="">— select a model —</option>
                  {ollamaModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                    onClick={() => { setOllamaModels([]); setLlmModel(""); }}
                  >
                    ✕ Clear
                  </button>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    {ollamaModels.length} model{ollamaModels.length !== 1 ? "s" : ""} found
                  </span>
                </div>
              </>
            ) : (
              <>
                <input
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  placeholder={DEFAULT_MODELS[llmProvider] || "model name"}
                />
                {llmProvider === "ollama" && (
                  <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
                      disabled={listOllamaModels.isPending}
                      onClick={() => { setOllamaError(null); listOllamaModels.mutate(); }}
                    >
                      {listOllamaModels.isPending ? "Fetching…" : "⟳ Fetch available models"}
                    </button>
                    {ollamaError && (
                      <span style={{ fontSize: "0.75rem", color: "var(--red, #ef4444)" }}>{ollamaError}</span>
                    )}
                  </div>
                )}
              </>
            )}
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
              {llmProvider === "openai" && "Recommended: gpt-4o-mini (fast/cheap), gpt-4o (best quality)"}
              {llmProvider === "anthropic" && "Recommended: claude-3-haiku-20240307 (fast), claude-3-5-sonnet-20241022 (best)"}
              {llmProvider === "ollama" && "Click \"Fetch available models\" to load the list from your Ollama instance, or type a model name manually."}
              {llmProvider === "openai-compat" && "Check your provider's documentation for available model names"}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={updateLLM.isPending}>
              {updateLLM.isPending ? "Saving…" : "Save LLM Settings"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={testLLM.isPending || !llmStatus?.isConfigured}
              onClick={() => testLLM.mutate()}
            >
              {testLLM.isPending ? "Testing…" : "Test Connection"}
            </button>
            {llmSaved && <span style={{ color: "var(--teal)", fontSize: "0.8rem" }}>✓ Saved</span>}
          </div>

          {testLLM.data && (
            <div style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              background: "var(--bg-muted)",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontFamily: "var(--font-mono)",
              borderLeft: `3px solid ${testLLM.data.success ? "var(--teal)" : "var(--red, #ef4444)"}`,
            }}>
              <StatusDot ok={testLLM.data.success} />
              {testLLM.data.success ? "Connection successful" : "Connection failed"}
              {testLLM.data.message && (
                <div style={{ marginTop: "0.35rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>
                  {testLLM.data.message}
                </div>
              )}
            </div>
          )}

          {updateLLM.error && (
            <div style={{ color: "var(--red, #ef4444)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              {updateLLM.error.message}
            </div>
          )}
        </form>
      </SectionCard>

      {/* ── Image Generation ──────────────────────────────────────────────── */}
      <SectionCard title="Portrait Generation (Image AI)">
        <form onSubmit={(e) => {
          e.preventDefault();
          updateImage.mutate({
            provider: imgProvider as any,
            apiKey: imgApiKey,
            model: imgModel || undefined,
          });
        }}>
          <div className="form-group">
            <label>Provider</label>
            <select value={imgProvider} onChange={(e) => setImgProvider(e.target.value)}>
              {IMAGE_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {imgNeedsKey && (
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={imgApiKey}
                onChange={(e) => setImgApiKey(e.target.value)}
                placeholder={imgApiKey.startsWith("••••") ? "Leave blank to keep existing key" : "sk-..."}
                autoComplete="new-password"
              />
            </div>
          )}

          {imgProvider !== "none" && (
            <div className="form-group">
              <label>Model (optional)</label>
              <input
                value={imgModel}
                onChange={(e) => setImgModel(e.target.value)}
                placeholder={imgProvider === "openai" ? "dall-e-3" : "stable-diffusion-xl-1024-v1-0"}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={updateImage.isPending}>
              {updateImage.isPending ? "Saving…" : "Save Image Settings"}
            </button>
            {imgSaved && <span style={{ color: "var(--teal)", fontSize: "0.8rem" }}>✓ Saved</span>}
          </div>

          {updateImage.error && (
            <div style={{ color: "var(--red, #ef4444)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              {updateImage.error.message}
            </div>
          )}
        </form>
      </SectionCard>

      {/* ── Security ──────────────────────────────────────────────────────── */}
      <SectionCard title="Security">
        <form onSubmit={(e) => {
          e.preventDefault();
          updateSecurity.mutate({ requireInvite });
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <input
              type="checkbox"
              id="require-invite"
              checked={requireInvite}
              onChange={(e) => setRequireInvite(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="require-invite" style={{ cursor: "pointer", fontSize: "0.875rem" }}>
              Require invite code for new registrations
            </label>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
            When enabled, new users must enter a valid invite code on the registration page.
            Invite codes are generated from the GM Panel for each session.
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={updateSecurity.isPending}>
              {updateSecurity.isPending ? "Saving…" : "Save Security Settings"}
            </button>
            {secSaved && <span style={{ color: "var(--teal)", fontSize: "0.8rem" }}>✓ Saved</span>}
          </div>

          {updateSecurity.error && (
            <div style={{ color: "var(--red, #ef4444)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              {updateSecurity.error.message}
            </div>
          )}
        </form>
      </SectionCard>

      {/* ── Environment reference ─────────────────────────────────────────── */}
      <div style={{ padding: "1rem", background: "var(--bg-muted)", borderRadius: "8px", fontSize: "0.8rem", color: "var(--text-dim)" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-muted)" }}>
          Equivalent environment variables
        </div>
        <div style={{ fontFamily: "var(--font-mono)", lineHeight: 1.8 }}>
          LLM_PROVIDER={llmProvider}<br />
          LLM_MODEL={llmModel || DEFAULT_MODELS[llmProvider] || "(default)"}<br />
          {needsBaseUrl && <>LLM_BASE_URL={llmBaseUrl || "(not set)"}<br /></>}
          LLM_API_KEY=(hidden)<br />
          IMAGE_PROVIDER={imgProvider}<br />
          REQUIRE_INVITE={requireInvite ? "true" : "false"}
        </div>
      </div>
    </div>
  );
}
