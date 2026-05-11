import { client } from "./index.js";

/**
 * Run all CREATE TABLE IF NOT EXISTS statements directly.
 * This avoids needing drizzle-kit generate/migrate in production —
 * just run `node server/db/migrate.js` or it's called automatically on startup.
 */
export async function runMigrations() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      display_name TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      last_signed_in INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      callsign TEXT,
      job_title TEXT NOT NULL DEFAULT 'Security Analyst',
      bio TEXT,
      avatar_url TEXT,
      avatar_prompt TEXT,
      xp INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      parent_skill_id INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
      dc INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS ai_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      supervisor_id INTEGER REFERENCES users(id),
      incident_id INTEGER REFERENCES incidents(id),
      status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','active','completed')),
      current_turn_user_id INTEGER REFERENCES users(id),
      turn_deadline INTEGER,
      gm_notes TEXT,
      llm_provider TEXT DEFAULT 'openai',
      llm_model TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS session_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      character_id INTEGER REFERENCES characters(id),
      turn_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      joined_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS session_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
      author_id INTEGER REFERENCES users(id),
      author_type TEXT NOT NULL CHECK(author_type IN ('ai','player','gm','system')),
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      roll_data TEXT,
      skill_ruling TEXT CHECK(skill_ruling IN ('approved','denied','partial')),
      dc_set INTEGER,
      is_incident_chain INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS session_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES ai_sessions(id),
      user_id INTEGER REFERENCES users(id),
      event_type TEXT NOT NULL,
      details TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS incident_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
      dc INTEGER,
      tags TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS supervisor_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES ai_sessions(id) ON DELETE CASCADE,
      session_title TEXT NOT NULL,
      supervisor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('player_acted','turn_waiting','player_inactive','player_kicked','turn_skipped')),
      player_name TEXT,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      invite_type TEXT NOT NULL DEFAULT 'session' CHECK(invite_type IN ('session','registration')),
      session_id INTEGER REFERENCES ai_sessions(id) ON DELETE CASCADE,
      created_by INTEGER NOT NULL REFERENCES users(id),
      used_by INTEGER REFERENCES users(id),
      used_at INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);


  // Alter existing tables to add new columns (safe — IF NOT EXISTS not supported in SQLite ALTER, so we try/catch)
  const alterStatements = [
    "ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE invite_codes ADD COLUMN invite_type TEXT NOT NULL DEFAULT 'session'",
  ];
  for (const stmt of alterStatements) {
    try { await db.execute(stmt); } catch { /* column already exists */ }
  }
  console.log("[DB] Migrations complete");
}
