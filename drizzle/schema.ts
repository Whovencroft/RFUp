import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Characters: one per user
export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 128 }).notNull(),
  xp: int("xp").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

// Skills: each character has a list of skills with levels
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  level: int("level").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

// Incidents: pre-written + GM-submitted security scenarios
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  difficulty: int("difficulty").default(7).notNull(), // opposing roll target
  isActive: boolean("isActive").default(false).notNull(),
  createdBy: int("createdBy"), // null = seeded, otherwise userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

// Session log: shared feed of events
export const sessionLog = mysqlTable("session_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  characterName: varchar("characterName", { length: 128 }).notNull(),
  eventType: mysqlEnum("eventType", [
    "roll",
    "skill_gained",
    "xp_awarded",
    "xp_spent",
    "incident_activated",
  ]).notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for extra data (dice results, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionLogEntry = typeof sessionLog.$inferSelect;
export type InsertSessionLogEntry = typeof sessionLog.$inferInsert;

// AI Sessions: a play-by-post game run by the AI Shift Supervisor
export const aiSessions = mysqlTable("ai_sessions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  incitingIncidentId: int("incitingIncidentId"), // starting incident
  status: mysqlEnum("status", ["active", "ended"]).default("active").notNull(),
  // JSON array of userId numbers in turn order
  playerOrder: text("playerOrder").notNull().default("[]"),
  // userId of the player whose turn it currently is (null = waiting for GM to start)
  currentTurnUserId: int("currentTurnUserId"),
  // running context summary the AI maintains to avoid token bloat
  contextSummary: text("contextSummary"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiSession = typeof aiSessions.$inferSelect;
export type InsertAiSession = typeof aiSessions.$inferInsert;

// AI Messages: the shared feed for an AI session
export const aiMessages = mysqlTable("ai_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  // "ai" for the AI Shift Supervisor, or a userId for a player
  authorType: mysqlEnum("authorType", ["ai", "player"]).notNull(),
  authorId: int("authorId"), // null when authorType = "ai"
  authorName: varchar("authorName", { length: 128 }).notNull(),
  content: text("content").notNull(),
  // JSON: { dice: number[], total: number, skillName: string, skillLevel: number }
  rollData: text("rollData"),
  // AI-set DC for this action (populated on AI response messages)
  dcSet: int("dcSet"),
  // "approved" | "denied" | "partial" — AI ruling on skill applicability
  skillRuling: mysqlEnum("skillRuling", ["approved", "denied", "partial"]),
  // true if this AI message introduces a new chained incident
  isIncidentChain: boolean("isIncidentChain").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;
