/**
 * Configurable LLM provider.
 *
 * Supported providers (set via env vars):
 *   LLM_PROVIDER=openai      → OpenAI (default)
 *   LLM_PROVIDER=anthropic   → Anthropic Claude
 *   LLM_PROVIDER=ollama      → Local Ollama instance
 *   LLM_PROVIDER=openai-compat → Any OpenAI-compatible endpoint (LM Studio, Together, etc.)
 *
 * Required env vars per provider:
 *   OpenAI:        LLM_API_KEY, LLM_MODEL (default: gpt-4o-mini)
 *   Anthropic:     LLM_API_KEY, LLM_MODEL (default: claude-3-haiku-20240307)
 *   Ollama:        LLM_BASE_URL (default: http://localhost:11434), LLM_MODEL (default: llama3)
 *   OpenAI-compat: LLM_BASE_URL, LLM_API_KEY (optional), LLM_MODEL
 *
 * If no provider is configured, returns a fallback message so the game
 * still works in supervisor-only mode.
 */

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMConfig {
  provider: string;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  isConfigured: boolean;
}

export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;

  switch (provider) {
    case "openai":
      return {
        provider: "openai",
        model: model ?? "gpt-4o-mini",
        apiKey,
        isConfigured: !!apiKey,
      };
    case "anthropic":
      return {
        provider: "anthropic",
        model: model ?? "claude-3-haiku-20240307",
        apiKey,
        isConfigured: !!apiKey,
      };
    case "ollama":
      return {
        provider: "ollama",
        model: model ?? "llama3",
        baseUrl: baseUrl ?? "http://localhost:11434",
        isConfigured: true, // Ollama doesn't need an API key
      };
    case "openai-compat":
      return {
        provider: "openai-compat",
        model: model ?? "default",
        baseUrl: baseUrl ?? "http://localhost:1234/v1",
        apiKey,
        isConfigured: !!baseUrl,
      };
    default:
      return {
        provider: "none",
        model: "",
        isConfigured: false,
      };
  }
}

export async function invokeLLM(messages: LLMMessage[]): Promise<string> {
  const config = getLLMConfig();

  if (!config.isConfigured) {
    return "[AI GM unavailable — no LLM provider configured. The supervisor can respond manually.]";
  }

  try {
    if (config.provider === "anthropic") {
      return await callAnthropic(messages, config);
    } else if (config.provider === "ollama") {
      return await callOllama(messages, config);
    } else {
      // openai or openai-compat
      return await callOpenAICompat(messages, config);
    }
  } catch (err) {
    console.error("[LLM] Error calling provider:", err);
    return "[AI GM encountered an error. The supervisor can respond manually.]";
  }
}

async function callOpenAICompat(messages: LLMMessage[], config: LLMConfig): Promise<string> {
  const baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.8,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

async function callAnthropic(messages: LLMMessage[], config: LLMConfig): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const userMessages = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      system: systemMsg?.content,
      messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json() as { content: Array<{ text: string }> };
  return data.content[0]?.text ?? "";
}

async function callOllama(messages: LLMMessage[], config: LLMConfig): Promise<string> {
  const res = await fetch(`${config.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = await res.json() as { message: { content: string } };
  return data.message?.content ?? "";
}

/**
 * Generate an image using DALL-E or a compatible image API.
 * Returns a local file path or null if image generation is not configured.
 */
export async function generatePortrait(opts: {
  name: string;
  callsign?: string | null;
  jobTitle: string;
  description?: string | null;
}): Promise<string | null> {
  const config = getLLMConfig();
  const imageApiKey = process.env.IMAGE_API_KEY ?? config.apiKey;
  const imageProvider = process.env.IMAGE_PROVIDER ?? (config.provider === "openai" ? "openai" : "none");

  if (imageProvider === "none" || !imageApiKey) {
    return null;
  }

  const prompt = `ID card portrait photograph. Upper two-thirds: professional headshot of ${opts.description ?? "a security professional"}. Lower third: dark institutional footer bar with white monospace text showing name "${opts.name}"${opts.callsign ? ` callsign "${opts.callsign}"` : ""} and title "${opts.jobTitle}". Retro sci-fi laminated badge aesthetic, dark teal and charcoal color scheme, high contrast, photorealistic.`;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${imageApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.IMAGE_MODEL ?? "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as { data: Array<{ url: string }> };
    return data.data[0]?.url ?? null;
  } catch {
    return null;
  }
}
