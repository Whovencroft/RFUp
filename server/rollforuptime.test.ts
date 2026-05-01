import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ── Mock db module ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getCharacterByUserId: vi.fn(),
  createCharacter: vi.fn(),
  updateCharacter: vi.fn(),
  getAllCharacters: vi.fn(),
  getSkillsByCharacterId: vi.fn(),
  addSkill: vi.fn(),
  getAllIncidents: vi.fn(),
  getActiveIncidents: vi.fn(),
  createIncident: vi.fn(),
  updateIncident: vi.fn(),
  getRecentSessionLog: vi.fn(),
  addSessionLogEntry: vi.fn(),
  seedIncidentsIfEmpty: vi.fn(),
  clearSessionLog: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([]),
  setUserRole: vi.fn().mockResolvedValue(undefined),
  getCharacterSessionHistory: vi.fn(),
}));

import * as db from "./db";

// ── Context helpers ─────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  const clearedCookies: unknown[] = [];
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@facility404.local",
      name: "Test Operator",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (_name: string, _opts: unknown) => clearedCookies.push({ _name, _opts }),
    } as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx({ role: "admin" });
}

// ── Auth tests ──────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeCtx();
    const clearedCookies: unknown[] = [];
    ctx.res.clearCookie = (name: string, opts: unknown) => clearedCookies.push({ name, opts });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect((clearedCookies[0] as { name: string }).name).toBe(COOKIE_NAME);
  });

  it("auth.me returns null for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ── Character tests ─────────────────────────────────────────────────────────
describe("character.get", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no character exists", async () => {
    vi.mocked(db.getCharacterByUserId).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.character.get();
    expect(result).toBeNull();
  });

  it("returns character with skills when character exists", async () => {
    const mockChar = { id: 10, userId: 1, name: "Agent Torres", jobTitle: "Night Sentinel", xp: 3, createdAt: new Date(), updatedAt: new Date() };
    const mockSkills = [{ id: 1, characterId: 10, name: "Do Anything", level: 1, createdAt: new Date() }];
    vi.mocked(db.getCharacterByUserId).mockResolvedValue(mockChar);
    vi.mocked(db.getSkillsByCharacterId).mockResolvedValue(mockSkills);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.character.get();
    expect(result?.name).toBe("Agent Torres");
    expect(result?.skills).toHaveLength(1);
    expect(result?.skills[0].name).toBe("Do Anything");
  });
});

describe("character.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a character and seeds Do Anything 1", async () => {
    vi.mocked(db.getCharacterByUserId).mockResolvedValue(undefined);
    const mockChar = { id: 10, userId: 1, name: "Unit 7", jobTitle: "Badge Reader Whisperer", xp: 0, createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(db.createCharacter).mockResolvedValue(mockChar);
    vi.mocked(db.addSkill).mockResolvedValue({ id: 1, characterId: 10, name: "Do Anything", level: 1, createdAt: new Date() });
    vi.mocked(db.getSkillsByCharacterId).mockResolvedValue([{ id: 1, characterId: 10, name: "Do Anything", level: 1, createdAt: new Date() }]);
    vi.mocked(db.addSessionLogEntry).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.character.create({ name: "Unit 7", jobTitle: "Badge Reader Whisperer" });
    expect(result.name).toBe("Unit 7");
    expect(db.addSkill).toHaveBeenCalledWith(expect.objectContaining({ name: "Do Anything", level: 1 }));
  });

  it("throws CONFLICT if character already exists", async () => {
    vi.mocked(db.getCharacterByUserId).mockResolvedValue({ id: 10, userId: 1, name: "Existing", jobTitle: "Existing", xp: 0, createdAt: new Date(), updatedAt: new Date() });
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.character.create({ name: "New", jobTitle: "New" })).rejects.toThrow("Character already exists");
  });
});

// ── Incident tests ──────────────────────────────────────────────────────────
describe("incidents.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns list of incidents", async () => {
    vi.mocked(db.seedIncidentsIfEmpty).mockResolvedValue(undefined);
    vi.mocked(db.getAllIncidents).mockResolvedValue([
      { id: 1, title: "Badge Anomaly", description: "...", difficulty: 7, isActive: false, createdBy: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.incidents.list();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Badge Anomaly");
  });
});

describe("incidents.create (admin only)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admin to create an incident", async () => {
    const mockIncident = { id: 99, title: "Test Incident", description: "Test", difficulty: 8, isActive: false, createdBy: 1, createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(db.createIncident).mockResolvedValue(mockIncident);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.incidents.create({ title: "Test Incident", description: "Test", difficulty: 8 });
    expect(result?.title).toBe("Test Incident");
  });

  it("blocks non-admin from creating incidents", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.incidents.create({ title: "Hack", description: "...", difficulty: 5 })).rejects.toThrow("Shift Supervisor access required");
  });
});

// ── Session log tests ───────────────────────────────────────────────────────
describe("sessionLog.recent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns recent log entries", async () => {
    vi.mocked(db.getRecentSessionLog).mockResolvedValue([
      { id: 1, userId: 1, characterName: "Agent Torres", eventType: "roll", description: "Rolled 1d6", metadata: null, createdAt: new Date() },
    ]);
    const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessionLog.recent();
    expect(result).toHaveLength(1);
    expect(result[0].characterName).toBe("Agent Torres");
  });
});

// ── GM: clearSessionLog tests ───────────────────────────────────────────────
describe("gm.clearSessionLog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admin to clear the session log", async () => {
    vi.mocked(db.clearSessionLog).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.gm.clearSessionLog();
    expect(result).toEqual({ success: true });
    expect(db.clearSessionLog).toHaveBeenCalledOnce();
  });

  it("blocks non-admin from clearing the session log", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.gm.clearSessionLog()).rejects.toThrow("Shift Supervisor access required");
  });
});

// ── incidents.active tests ──────────────────────────────────────────────────
describe("incidents.active", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only active incidents", async () => {
    vi.mocked(db.getActiveIncidents).mockResolvedValue([
      { id: 2, title: "Rogue Device", description: "...", difficulty: 9, isActive: true, createdBy: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.incidents.active();
    expect(result).toHaveLength(1);
    expect(result[0].isActive).toBe(true);
    expect(result[0].title).toBe("Rogue Device");
  });

  it("returns empty array when no active incidents", async () => {
    vi.mocked(db.getActiveIncidents).mockResolvedValue([]);
    const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.incidents.active();
    expect(result).toHaveLength(0);
  });
});

// ── character.getSessionHistory tests ──────────────────────────────────────
describe("character.getSessionHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns session history for authenticated user", async () => {
    const mockHistory = [
      { id: 1, title: "Night Shift Alpha", status: "ended" as const, createdAt: new Date(), debriefContent: "Great work tonight." },
    ];
    vi.mocked(db.getCharacterSessionHistory).mockResolvedValue(mockHistory);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.character.getSessionHistory();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Night Shift Alpha");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.character.getSessionHistory()).rejects.toThrow();
  });
});
