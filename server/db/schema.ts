import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  lastSignedIn: integer("last_signed_in", { mode: "timestamp_ms" }),
});

// ── Characters (Operator Files) ───────────────────────────────────────────────

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  callsign: text("callsign"),
  jobTitle: text("job_title").notNull().default("Security Analyst"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  avatarPrompt: text("avatar_prompt"),
  xp: integer("xp").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Skills ────────────────────────────────────────────────────────────────────

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  parentSkillId: integer("parent_skill_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Incidents ─────────────────────────────────────────────────────────────────

export const incidents = sqliteTable("incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  dc: integer("dc"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── AI Sessions ───────────────────────────────────────────────────────────────

export const aiSessions = sqliteTable("ai_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  supervisorId: integer("supervisor_id").references(() => users.id),
  incidentId: integer("incident_id").references(() => incidents.id),
  status: text("status", { enum: ["waiting", "active", "completed"] }).notNull().default("waiting"),
  currentTurnUserId: integer("current_turn_user_id").references(() => users.id),
  turnDeadline: integer("turn_deadline", { mode: "timestamp_ms" }),
  gmNotes: text("gm_notes"),
  llmProvider: text("llm_provider").default("openai"),
  llmModel: text("llm_model"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Session Players ───────────────────────────────────────────────────────────

export const sessionPlayers = sqliteTable("session_players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => aiSessions.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterId: integer("character_id").references(() => characters.id),
  turnOrder: integer("turn_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Session Messages ──────────────────────────────────────────────────────────

export const sessionMessages = sqliteTable("session_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => aiSessions.id, { onDelete: "cascade" }),
  authorId: integer("author_id").references(() => users.id),
  authorType: text("author_type", { enum: ["ai", "player", "gm", "system"] }).notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  rollData: text("roll_data"), // JSON: { dice, total, skillName, skillLevel }
  skillRuling: text("skill_ruling", { enum: ["approved", "denied", "partial"] }),
  dcSet: integer("dc_set"),
  isIncidentChain: integer("is_incident_chain", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Session Log ───────────────────────────────────────────────────────────────

export const sessionLog = sqliteTable("session_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").references(() => aiSessions.id),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Incident Library ──────────────────────────────────────────────────────────

export const incidentLibrary = sqliteTable("incident_library", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  dc: integer("dc"),
  tags: text("tags"), // JSON array
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Supervisor Notifications ──────────────────────────────────────────────────

export const supervisorNotifications = sqliteTable("supervisor_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").references(() => aiSessions.id, { onDelete: "cascade" }),
  sessionTitle: text("session_title").notNull(),
  supervisorUserId: integer("supervisor_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["player_acted", "turn_waiting", "player_inactive", "player_kicked", "turn_skipped"] }).notNull(),
  playerName: text("player_name"),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Invite Codes ──────────────────────────────────────────────────────────────

export const inviteCodes = sqliteTable("invite_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  sessionId: integer("session_id").references(() => aiSessions.id, { onDelete: "cascade" }),
  createdBy: integer("created_by").notNull().references(() => users.id),
  usedBy: integer("used_by").references(() => users.id),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ── Admin Settings ────────────────────────────────────────────────────────────
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});
