import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import {
  registerUser,
  loginUser,
  setSessionCookie,
  clearSessionCookie,
} from "../auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getLLMConfig } from "../llm.js";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),

  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
        email: z.string().email(),
        password: z.string().min(8).max(128),
        displayName: z.string().min(1).max(64).optional(),
        inviteCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if registration is open or invite-only
      const requireInvite = process.env.REQUIRE_INVITE === "true";
      if (requireInvite && !input.inviteCode) {
        throw new TRPCError({ code: "FORBIDDEN", message: "An invite code is required to register." });
      }

      // Check if this is the first user — make them admin
      const [existingCount] = await db.select({ count: users.id }).from(users).limit(1);
      const isFirstUser = !existingCount;

      try {
        const user = await registerUser({
          username: input.username,
          email: input.email,
          password: input.password,
          displayName: input.displayName,
          role: isFirstUser ? "admin" : "user",
        });
        setSessionCookie(ctx.res, user);
        return { success: true, user };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("UNIQUE") || msg.includes("unique")) {
          throw new TRPCError({ code: "CONFLICT", message: "Username or email already taken." });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registration failed." });
      }
    }),

  login: publicProcedure
    .input(
      z.object({
        usernameOrEmail: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await loginUser(input.usernameOrEmail, input.password);
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password." });
      }
      setSessionCookie(ctx.res, user);
      return { success: true, user };
    }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    clearSessionCookie(ctx.res);
    return { success: true };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(64).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(users)
        .set({
          ...(input.displayName ? { displayName: input.displayName } : {}),
          ...(input.email ? { email: input.email.toLowerCase() } : {}),
        })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  llmStatus: publicProcedure.query(() => {
    const config = getLLMConfig();
    return {
      provider: config.provider,
      model: config.model,
      isConfigured: config.isConfigured,
    };
  }),
});
