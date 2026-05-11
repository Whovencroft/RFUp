import { router } from "../trpc.js";
import { authRouter } from "./auth.js";
import { characterRouter } from "./character.js";
import { sessionsRouter } from "./sessions.js";
import { incidentsRouter } from "./incidents.js";
import { adminRouter } from "./admin.js";
import { adminUsersRouter } from "./admin-users.js";
import { adminThemeRouter } from "./admin-theme.js";

export const appRouter = router({
  auth: authRouter,
  character: characterRouter,
  sessions: sessionsRouter,
  incidents: incidentsRouter,
  admin: adminRouter,
  adminUsers: adminUsersRouter,
  theme: adminThemeRouter,
});

export type AppRouter = typeof appRouter;
