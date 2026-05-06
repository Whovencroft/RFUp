import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH ?? "./data/rfu.db";

// Ensure the data directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

export type DB = typeof db;
