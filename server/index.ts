import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers/index.js";
import { createContext } from "./trpc.js";
import { runMigrations } from "./db/migrate.js";
import { initSocketIO } from "./realtime.js";
import { ensureUploadsDir } from "./storage.js";
import { loadPersistedSettings } from "./routers/admin.js";
import { loadPersistedTheme } from "./routers/admin-theme.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? "3000");
const isDev = process.env.NODE_ENV !== "production";

async function main() {
  // Run DB migrations on startup
  await runMigrations();
  await loadPersistedSettings();
  await loadPersistedTheme();
  ensureUploadsDir();

  const app = express();
  const httpServer = createServer(app);

  // Init Socket.io
  initSocketIO(httpServer);

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN ?? (isDev ? "http://localhost:5173" : false),
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));

  // Serve uploaded files (portraits, etc.)
  const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: "1.0.0" });
  });

  // Serve frontend in production
  if (!isDev) {
    // In production, client/dist is at <project_root>/client/dist
    const clientDist = path.join(process.cwd(), "client", "dist");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`\n🎲 Roll for Uptime is running!`);
    console.log(`   → http://localhost:${PORT}`);
    console.log(`   → Mode: ${isDev ? "development" : "production"}`);
    console.log(`   → DB: ${process.env.DATABASE_PATH ?? "./data/rfu.db"}`);
    console.log(`   → LLM: ${process.env.LLM_PROVIDER ?? "openai"} (${process.env.LLM_API_KEY ? "configured" : "NOT configured — supervisor-only mode"})\n`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
