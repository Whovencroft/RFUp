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
  callsign: varchar("callsign", { length: 64 }),          // NEW: short callsign
  avatarUrl: text("avatarUrl"),                            // NEW: AI-generated avatar URL
  avatarPrompt: text("avatarPrompt"),                      // NEW: prompt used to generate avatar
  bio: text("bio"),                                          // NEW: player-written backstory/bio
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
  parentSkillId: int("parentSkillId"),                    // NEW: lineage tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

// Incidents: pre-written + GM-submitted security scenarios
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  difficulty: int("difficulty").default(7).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdBy: int("createdBy"),
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
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionLogEntry = typeof sessionLog.$inferSelect;
export type InsertSessionLogEntry = typeof sessionLog.$inferInsert;

// AI Sessions: a play-by-post game run by the AI Shift Supervisor
export const aiSessions = mysqlTable("ai_sessions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  incitingIncidentId: int("incitingIncidentId"),
  status: mysqlEnum("status", ["active", "ended"]).default("active").notNull(),
  playerOrder: text("playerOrder").notNull().default("[]"),
  currentTurnUserId: int("currentTurnUserId"),
  contextSummary: text("contextSummary"),
  gmNotes: text("gmNotes"),                               // NEW: private GM notes
  inviteToken: varchar("inviteToken", { length: 64 }),    // NEW: invite link token
  debriefContent: text("debriefContent"),                 // NEW: post-session AI debrief
  gmMode: mysqlEnum("gmMode", ["ai", "supervisor"]).default("ai").notNull(), // NEW: who leads the session
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
  authorType: mysqlEnum("authorType", ["ai", "player", "gm"]).notNull(), // EXTENDED: added "gm"
  authorId: int("authorId"),
  authorName: varchar("authorName", { length: 128 }).notNull(),
  content: text("content").notNull(),
  rollData: text("rollData"),
  dcSet: int("dcSet"),
  skillRuling: mysqlEnum("skillRuling", ["approved", "denied", "partial"]),
  isIncidentChain: boolean("isIncidentChain").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;

// Session Join Requests: players request to join open sessions
export const sessionJoinRequests = mysqlTable("session_join_requests", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 128 }).notNull(),
  characterName: varchar("characterName", { length: 128 }),
  status: mysqlEnum("status", ["pending", "approved", "denied"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SessionJoinRequest = typeof sessionJoinRequests.$inferSelect;
export type InsertSessionJoinRequest = typeof sessionJoinRequests.$inferInsert;

// Shift Schedules: recurring session templates (GM-only)
export const shiftSchedules = mysqlTable("shift_schedules", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  // cron expression e.g. "0 0 9 * * 1" = Monday 9am
  cronExpression: varchar("cronExpression", { length: 64 }).notNull(),
  incidentPoolIds: text("incidentPoolIds").notNull().default("[]"), // JSON array of incident IDs
  defaultPlayerIds: text("defaultPlayerIds").notNull().default("[]"), // JSON array of user IDs
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftSchedule = typeof shiftSchedules.$inferSelect;
export type InsertShiftSchedule = typeof shiftSchedules.$inferInsert;

// Commendations: manual awards given by Shift Supervisors at session end
export const commendations = mysqlTable("commendations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  characterId: int("characterId").notNull(),
  characterName: varchar("characterName", { length: 128 }).notNull(),
  awardedByUserId: int("awardedByUserId").notNull(),
  awardedByName: varchar("awardedByName", { length: 128 }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Commendation = typeof commendations.$inferSelect;
export type InsertCommendation = typeof commendations.$inferInsert;
