import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  characters,
  InsertCharacter,
  skills,
  InsertSkill,
  incidents,
  InsertIncident,
  sessionLog,
  InsertSessionLogEntry,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ── Characters ─────────────────────────────────────────────────────────────

export async function getCharacterByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, userId))
    .limit(1);
  return result[0];
}

export async function createCharacter(data: InsertCharacter) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(characters).values(data);
  const result = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, data.userId))
    .limit(1);
  return result[0];
}

export async function updateCharacter(
  id: number,
  data: Partial<Pick<InsertCharacter, "name" | "jobTitle" | "xp">>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(characters).set(data).where(eq(characters.id, id));
}

export async function getAllCharacters() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(characters);
}

// ── Skills ─────────────────────────────────────────────────────────────────

export async function getSkillsByCharacterId(characterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skills).where(eq(skills.characterId, characterId));
}

export async function addSkill(data: InsertSkill) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(skills).values(data);
  const result = await db
    .select()
    .from(skills)
    .where(and(eq(skills.characterId, data.characterId), eq(skills.name, data.name)))
    .limit(1);
  return result[0];
}

// ── Incidents ──────────────────────────────────────────────────────────────

export async function getAllIncidents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(incidents).orderBy(desc(incidents.createdAt));
}

export async function getActiveIncidents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(incidents).where(eq(incidents.isActive, true));
}

export async function createIncident(data: InsertIncident) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(incidents).values(data);
  const result = await db
    .select()
    .from(incidents)
    .orderBy(desc(incidents.createdAt))
    .limit(1);
  return result[0];
}

export async function updateIncident(
  id: number,
  data: Partial<Pick<InsidentRow, "title" | "description" | "difficulty" | "isActive">>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(incidents).set(data).where(eq(incidents.id, id));
}

type InsidentRow = typeof incidents.$inferSelect;

// ── Session Log ────────────────────────────────────────────────────────────

export async function getRecentSessionLog(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(sessionLog)
    .orderBy(desc(sessionLog.createdAt))
    .limit(limit);
}

export async function addSessionLogEntry(data: InsertSessionLogEntry) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(sessionLog).values(data);
}

// ── Admin: User Management ────────────────────────────────────────────────

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function setUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ── Seed Incidents ─────────────────────────────────────────────────────────

export async function seedIncidentsIfEmpty() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(incidents).limit(1);
  if (existing.length > 0) return;

  const seedData: InsertIncident[] = [
    {
      title: "Unauthorized Badge Swipe — Server Corridor B",
      description:
        "An access control alert has fired: an unrecognized badge was swiped at the entrance to Server Corridor B at 02:17. The badge ID does not match any current employee or contractor record. CCTV coverage of that corridor went offline 4 minutes prior.",
      difficulty: 8,
      isActive: false,
    },
    {
      title: "Suspicious Vendor Visit",
      description:
        "A vendor claiming to represent a UPS maintenance contractor arrived without a scheduled work order. They have a laminated badge that looks almost right. They are asking for unescorted access to the power distribution room.",
      difficulty: 6,
      isActive: false,
    },
    {
      title: "Rogue Device on the Network",
      description:
        "The network monitoring system flagged an unregistered MAC address in VLAN 10 — the secure management network. The device has been pinging internal infrastructure nodes for the past 20 minutes. No one has reported plugging anything in.",
      difficulty: 9,
      isActive: false,
    },
    {
      title: "Camera Blind Spot — Loading Dock",
      description:
        "A routine camera audit has revealed a 12-foot blind spot at the loading dock entrance. A delivery van has been parked in that exact spot for the last 90 minutes. The driver has not checked in at the security desk.",
      difficulty: 7,
      isActive: false,
    },
    {
      title: "Tailgating Incident — Main Entrance",
      description:
        "Security footage shows two individuals entering the main access vestibule on a single badge swipe. The second person is wearing a high-visibility vest and carrying a large equipment case. Neither has signed in.",
      difficulty: 7,
      isActive: false,
    },
    {
      title: "Badge Reader Anomaly — Cage 7",
      description:
        "The badge reader on Cage 7 has been granting access to all presented badges regardless of permission level for the past 45 minutes. A firmware update was pushed to that reader this morning by a third-party vendor.",
      difficulty: 8,
      isActive: false,
    },
    {
      title: "After-Hours Access Attempt",
      description:
        "At 03:40, a valid employee badge was used to attempt access to the executive briefing suite — a room that employee has no business reason to enter. The employee in question is currently listed as on approved leave.",
      difficulty: 8,
      isActive: false,
    },
    {
      title: "Perimeter Fence Sensor Alert",
      description:
        "A vibration sensor on the east perimeter fence has triggered twice in the last ten minutes. The patrol drone dispatched to investigate has lost its uplink. Manual patrol is required, but the night shift is one person short.",
      difficulty: 9,
      isActive: false,
    },
    {
      title: "Visitor Badge Not Returned",
      description:
        "A visitor checked in at 09:00 for a scheduled tour. The tour ended at 11:30. It is now 16:00 and the visitor badge has not been returned. The visitor's escort has no idea where they went after the tour concluded.",
      difficulty: 6,
      isActive: false,
    },
    {
      title: "Social Engineering Attempt — Help Desk",
      description:
        "The help desk has escalated a call from someone claiming to be a senior engineer locked out of their account. They have correctly answered three security questions but cannot produce a valid employee ID number. They are becoming increasingly insistent.",
      difficulty: 7,
      isActive: false,
    },
    {
      title: "Unscheduled Biometric Enrollment",
      description:
        "The biometric enrollment terminal in the security office logged an unscheduled fingerprint enrollment at 22:55 last night. The terminal requires two-person authorization for enrollment. The audit log shows only one operator credential was used.",
      difficulty: 10,
      isActive: false,
    },
    {
      title: "Contractor Overstay",
      description:
        "A licensed electrical contractor was granted a 4-hour access window for scheduled maintenance. That window expired 2 hours ago. Their vehicle is still in the lot, their badge is still active, and they are not responding to radio calls.",
      difficulty: 6,
      isActive: false,
    },
  ];

  await db.insert(incidents).values(seedData);
}
