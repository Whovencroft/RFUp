/**
 * Admin settings router.
 * Allows the admin (Shift Supervisor) to read and update LLM/image provider
 * configuration at runtime without restarting the server.
 *
 * Settings are persisted in the `settings` table in SQLite so they survive
 * restarts. On startup, values from the DB override env vars.
 */

import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../trpc.js";
import { getDb } from "../db/index.js";
import { settings } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getLLMConfig } from "../llm.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return rows[0]?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(settings).where(eq(settings.key, key));
  if (existing.length > 0) {
    await db.update(settings).set({ value, updatedAt: Date.now() }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value, updatedAt: Date.now() });
  }
  // Also update the live process.env so the change takes effect immediately
  const envMap: Record<string, string> = {
    llm_provider: "LLM_PROVIDER",
    llm_api_key: "LLM_API_KEY",
    llm_model: "LLM_MODEL",
    llm_base_url: "LLM_BASE_URL",
    image_provider: "IMAGE_PROVIDER",
    image_api_key: "IMAGE_API_KEY",
    image_model: "IMAGE_MODEL",
    require_invite: "REQUIRE_INVITE",
  };
  if (envMap[key]) {
    process.env[envMap[key]] = value;
  }
}

// ─── Load persisted settings into process.env on startup ──────────────────────

export async function loadPersistedSettings(): Promise<void> {
  try {
    const db = getDb();
    const rows = await db.select().from(settings);
    const envMap: Record<string, string> = {
      llm_provider: "LLM_PROVIDER",
      llm_api_key: "LLM_API_KEY",
      llm_model: "LLM_MODEL",
      llm_base_url: "LLM_BASE_URL",
      image_provider: "IMAGE_PROVIDER",
      image_api_key: "IMAGE_API_KEY",
      image_model: "IMAGE_MODEL",
      require_invite: "REQUIRE_INVITE",
    };
    for (const row of rows) {
      if (envMap[row.key] && row.value) {
        process.env[envMap[row.key]] = row.value;
      }
    }
    console.log(`[Settings] Loaded ${rows.length} persisted settings`);
  } catch {
    // Settings table may not exist yet on first run — that's fine
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

const LLM_PROVIDERS = ["openai", "anthropic", "ollama", "openai-compat", "none"] as const;
const IMAGE_PROVIDERS = ["openai", "stability", "none"] as const;

export const adminRouter = router({
  // Public: returns safe LLM status (no API key) — used in GmPanel header
  llmStatus: publicProcedure.query(async () => {
    const config = getLLMConfig();
    return {
      isConfigured: config.isConfigured,
      provider: config.provider,
      model: config.model,
      hasBaseUrl: !!config.baseUrl,
    };
  }),

  // Admin: get full settings (API keys masked)
  getSettings: adminProcedure.query(async () => {
    const keys = [
      "llm_provider", "llm_api_key", "llm_model", "llm_base_url",
      "image_provider", "image_api_key", "image_model", "require_invite",
    ];
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      const val = await getSetting(key);
      // Mask API keys — show last 4 chars only
      if ((key === "llm_api_key" || key === "image_api_key") && val && val.length > 4) {
        result[key] = "••••" + val.slice(-4);
      } else {
        result[key] = val ?? process.env[key.toUpperCase().replace(/-/g, "_")] ?? null;
      }
    }
    return result;
  }),

  // Admin: update LLM settings
  updateLLM: adminProcedure
    .input(z.object({
      provider: z.enum(LLM_PROVIDERS),
      apiKey: z.string().optional(),      // empty string = don't change
      model: z.string().optional(),
      baseUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await setSetting("llm_provider", input.provider);
      if (input.model !== undefined) await setSetting("llm_model", input.model);
      if (input.baseUrl !== undefined) await setSetting("llm_base_url", input.baseUrl);
      // Only update API key if a non-empty value is provided (don't overwrite with empty)
      if (input.apiKey && input.apiKey.trim() && !input.apiKey.startsWith("••••")) {
        await setSetting("llm_api_key", input.apiKey.trim());
      }
      return { success: true, config: getLLMConfig() };
    }),

  // Admin: update image generation settings
  updateImage: adminProcedure
    .input(z.object({
      provider: z.enum(IMAGE_PROVIDERS),
      apiKey: z.string().optional(),
      model: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await setSetting("image_provider", input.provider);
      if (input.model !== undefined) await setSetting("image_model", input.model);
      if (input.apiKey && input.apiKey.trim() && !input.apiKey.startsWith("••••")) {
        await setSetting("image_api_key", input.apiKey.trim());
      }
      return { success: true };
    }),

  // Admin: update security settings
  updateSecurity: adminProcedure
    .input(z.object({
      requireInvite: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await setSetting("require_invite", input.requireInvite ? "true" : "false");
      return { success: true };
    }),

  // Admin: test LLM connection
  testLLM: adminProcedure.mutation(async () => {
    const { invokeLLM } = await import("../llm.js");
    const config = getLLMConfig();
    if (!config.isConfigured) {
      return { success: false, message: "No LLM provider configured." };
    }
    try {
      const response = await invokeLLM([
        { role: "system", content: "You are a test assistant. Respond with exactly: 'Connection successful.'" },
        { role: "user", content: "Test connection." },
      ]);
      const ok = response.toLowerCase().includes("connection") || response.length > 0;
      return { success: ok, message: response.slice(0, 200) };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }),

  // Admin: list available Ollama models from the configured base URL
  listOllamaModels: adminProcedure.mutation(async () => {
    const config = getLLMConfig();
    const baseUrl = config.baseUrl ?? process.env.LLM_BASE_URL ?? "http://localhost:11434";
    // Normalise: strip /v1 suffix if present — Ollama's native API is at /api/tags
    const ollamaBase = baseUrl.replace(/\/v1\/?$/, "");
    try {
      const res = await fetch(`${ollamaBase}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        return { success: false, models: [] as string[], error: `Ollama returned ${res.status}` };
      }
      const data = await res.json() as { models: Array<{ name: string }> };
      const models = (data.models ?? []).map((m) => m.name).sort();
      return { success: true, models, error: null };
    } catch (err) {
      return { success: false, models: [] as string[], error: `Could not reach Ollama at ${ollamaBase}` };
    }
  }),
});
