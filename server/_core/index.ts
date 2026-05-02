import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Scheduled task endpoint: check for 24h turn inactivity and notify Shift Supervisor
  app.post("/api/scheduled/check-turn-timeouts", async (req, res) => {
    try {
      const { listAiSessions, getDb } = await import("../db");
      const db = await getDb();
      if (!db) { res.json({ checked: 0, alerted: 0 }); return; }
      const sessions = await listAiSessions();
      const activeSessions = sessions.filter((s: any) => s.status === "active");
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const { updateAiSession, addSupervisorNotification: addNotif, getCharacterByUserId } = await import("../db");
      let alerted = 0;
      for (const session of activeSessions) {
        const currentTurnUserId = (session as any).currentTurnUserId;
        if (!currentTurnUserId) continue;
        const turnStartedAt = (session as any).turnStartedAt;
        if (!turnStartedAt) continue;
        const turnStartMs = turnStartedAt instanceof Date ? turnStartedAt.getTime() : Number(turnStartedAt);
        const elapsed = Date.now() - turnStartMs;
        if (elapsed < TWENTY_FOUR_HOURS) continue;
        // Dedup: skip if we already alerted for this exact player on this session
        if ((session as any).lastTimeoutAlertUserId === currentTurnUserId) continue;
        const supervisorUserId = (session as any).createdBy as number | undefined;
        if (!supervisorUserId) continue;
        const stuckChar = await getCharacterByUserId(currentTurnUserId).catch(() => null);
        const playerName = stuckChar?.name ?? `Operator #${currentTurnUserId}`;
        const sessionTitle = (session as any).title ?? `Session #${session.id}`;
        const hoursElapsed = Math.floor(elapsed / (60 * 60 * 1000));
        await addNotif({
          sessionId: session.id,
          sessionTitle,
          supervisorUserId,
          type: "player_inactive",
          playerName,
          message: `${playerName} has not taken their turn in "${sessionTitle}" for ${hoursElapsed} hours.`,
        }).catch(() => {});
        await updateAiSession(session.id, { lastTimeoutAlertUserId: currentTurnUserId }).catch(() => {});
        alerted++;
      }
      res.json({ checked: activeSessions.length, alerted });
    } catch (err) {
      console.error("[check-turn-timeouts]", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
