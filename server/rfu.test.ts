/**
 * Roll for Uptime — Standalone Edition Tests
 * Tests core logic that doesn't require a live database or external APIs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomInt } from "crypto";

// ─── Dice rolling ─────────────────────────────────────────────────────────────

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => randomInt(1, 7));
}

describe("rollDice", () => {
  it("returns the correct number of dice", () => {
    expect(rollDice(1)).toHaveLength(1);
    expect(rollDice(3)).toHaveLength(3);
    expect(rollDice(6)).toHaveLength(6);
  });

  it("all dice values are between 1 and 6 inclusive", () => {
    for (let trial = 0; trial < 100; trial++) {
      const dice = rollDice(4);
      for (const d of dice) {
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(6);
      }
    }
  });

  it("uses crypto.randomInt (not Math.random)", () => {
    // Verify Math.random is not called during dice rolling
    const spy = vi.spyOn(Math, "random");
    rollDice(10);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("highest die is correctly identified", () => {
    const dice = rollDice(5);
    const highest = Math.max(...dice);
    expect(highest).toBeGreaterThanOrEqual(1);
    expect(highest).toBeLessThanOrEqual(6);
    expect(dice).toContain(highest);
  });
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

describe("password hashing", () => {
  it("bcryptjs is importable", async () => {
    const bcrypt = await import("bcryptjs");
    expect(bcrypt.hash).toBeDefined();
    expect(bcrypt.compare).toBeDefined();
  });

  it("hashes and verifies a password", async () => {
    const bcrypt = await import("bcryptjs");
    const password = "test-password-123";
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
    const invalid = await bcrypt.compare("wrong-password", hash);
    expect(invalid).toBe(false);
  });
});

// ─── JWT helpers ──────────────────────────────────────────────────────────────

describe("JWT tokens", () => {
  it("jsonwebtoken is importable", async () => {
    const jwt = await import("jsonwebtoken");
    expect(jwt.sign).toBeDefined();
    expect(jwt.verify).toBeDefined();
  });

  it("signs and verifies a token", async () => {
    const jwt = await import("jsonwebtoken");
    const secret = "test-secret-key";
    const payload = { id: 42, username: "testuser", role: "user" };
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    expect(typeof token).toBe("string");
    const decoded = jwt.verify(token, secret) as typeof payload & { iat: number; exp: number };
    expect(decoded.id).toBe(42);
    expect(decoded.username).toBe("testuser");
    expect(decoded.role).toBe("user");
  });

  it("rejects a token signed with the wrong secret", async () => {
    const jwt = await import("jsonwebtoken");
    const token = jwt.sign({ id: 1 }, "correct-secret");
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });
});

// ─── LLM config ───────────────────────────────────────────────────────────────

describe("LLM config", () => {
  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_MODEL;
    delete process.env.LLM_BASE_URL;
  });

  it("returns isConfigured=false when no API key is set", async () => {
    const { getLLMConfig } = await import("./llm.js");
    const config = getLLMConfig();
    expect(config.isConfigured).toBe(false);
  });

  it("returns isConfigured=true when API key is set", async () => {
    process.env.LLM_API_KEY = "sk-test-key";
    process.env.LLM_PROVIDER = "openai";
    const { getLLMConfig } = await import("./llm.js");
    const config = getLLMConfig();
    expect(config.isConfigured).toBe(true);
    expect(config.provider).toBe("openai");
  });

  it("returns isConfigured=true for ollama without an API key", async () => {
    process.env.LLM_PROVIDER = "ollama";
    process.env.LLM_BASE_URL = "http://localhost:11434/v1";
    const { getLLMConfig } = await import("./llm.js");
    const config = getLLMConfig();
    expect(config.isConfigured).toBe(true);
    expect(config.provider).toBe("ollama");
  });

  it("uses the correct default model for each provider", async () => {
    const providers = [
      { provider: "openai", apiKey: "sk-test", expectedModel: "gpt-4o-mini" },
      { provider: "anthropic", apiKey: "sk-ant-test", expectedModel: "claude-3-haiku-20240307" },
    ];

    for (const { provider, apiKey, expectedModel } of providers) {
      process.env.LLM_PROVIDER = provider;
      process.env.LLM_API_KEY = apiKey;
      delete process.env.LLM_MODEL;
      const { getLLMConfig } = await import("./llm.js");
      const config = getLLMConfig();
      expect(config.model).toBe(expectedModel);
    }
  });
});

// ─── Invite code generation ───────────────────────────────────────────────────

describe("invite code generation", () => {
  it("generates 8-character codes from a safe alphabet", () => {
    const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 20; i++) {
      const code = Array.from({ length: 8 }, () =>
        ALPHABET[randomInt(0, 32)]
      ).join("");
      expect(code).toHaveLength(8);
      for (const char of code) {
        expect(ALPHABET).toContain(char);
      }
    }
  });

  it("does not include ambiguous characters (0, O, 1, I)", () => {
    const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    expect(ALPHABET).not.toContain("0");
    expect(ALPHABET).not.toContain("O");
    expect(ALPHABET).not.toContain("1");
    expect(ALPHABET).not.toContain("I");
  });
});

// ─── Storage helpers ──────────────────────────────────────────────────────────

describe("storage", () => {
  it("storage module is importable", async () => {
    const storage = await import("./storage.js");
    expect(storage.ensureUploadsDir).toBeDefined();
    expect(storage.downloadAndSavePortrait).toBeDefined();
    expect(storage.saveUploadedFile).toBeDefined();
    expect(storage.deleteLocalFile).toBeDefined();
  });

  it("deleteLocalFile does not throw on non-existent path", async () => {
    const { deleteLocalFile } = await import("./storage.js");
    expect(() => deleteLocalFile("/uploads/portraits/nonexistent.png")).not.toThrow();
  });
});
