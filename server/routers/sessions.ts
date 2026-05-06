import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import {
  aiSessions,
  sessionPlayers,
  sessionMessages,
  sessionLog,
  supervisorNotifications,
  inviteCodes,
  characters,
  users,
} from "../db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";
import { invokeLLM } from "../llm.js";
import { emitToSession, emitToSupervisor } from "../realtime.js";
import { randomInt } from "crypto";

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => randomInt(1, 7));
}

async function addNotification(opts: {
  sessionId: number;
  sessionTitle: string;
  supervisorId: number;
  type: "player_acted" | "turn_waiting" | "player_inactive" | "player_kicked" | "turn_skipped";
  playerName?: string;
  message: string;
}) {
  const [notif] = await db
    .insert(supervisorNotifications)
    .values({
      sessionId: opts.sessionId,
      sessionTitle: opts.sessionTitle,
      supervisorUserId: opts.supervisorId,
      type: opts.type,
      playerName: opts.playerName,
      message: opts.message,
    })
    .returning();

  emitToSupervisor(opts.supervisorId, {
    type: "notification:new",
    sessionId: opts.sessionId,
    payload: notif,
  });
}

export const sessionsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const playerRows = await db
      .select({ sessionId: sessionPlayers.sessionId })
      .from(sessionPlayers)
      .where(eq(sessionPlayers.userId, ctx.user.id));

    const sessionIds = playerRows.map((r) => r.sessionId);

    // Also include sessions where user is supervisor
    const supervisedRows = await db
      .select({ id: aiSessions.id })
      .from(aiSessions)
      .where(eq(aiSessions.supervisorId, ctx.user.id));

    const allIds = [...new Set([...sessionIds, ...supervisedRows.map((r) => r.id)])];
    if (allIds.length === 0) return [];

    return db
      .select()
      .from(aiSessions)
      .where(inArray(aiSessions.id, allIds))
      .orderBy(desc(aiSessions.updatedAt));
  }),

  listAll: adminProcedure.query(async () => {
    return db.select().from(aiSessions).orderBy(desc(aiSessions.createdAt));
  }),

  get: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const [session] = await db
        .select()
        .from(aiSessions)
        .where(eq(aiSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(128),
        incidentId: z.number().int().optional(),
        gmNotes: z.string().max(2000).optional(),
        llmProvider: z.string().optional(),
        llmModel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [session] = await db
        .insert(aiSessions)
        .values({
          title: input.title,
          supervisorId: ctx.user.id,
          incidentId: input.incidentId,
          gmNotes: input.gmNotes,
          llmProvider: input.llmProvider,
          llmModel: input.llmModel,
          status: "waiting",
        })
        .returning();

      await db.insert(sessionLog).values({
        sessionId: session.id,
        userId: ctx.user.id,
        eventType: "session_created",
        details: `Session "${session.title}" created`,
      });

      return session;
    }),

  join: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
        characterId: z.number().int().optional(),
        inviteCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [session] = await db
        .select()
        .from(aiSessions)
        .where(eq(aiSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status === "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This session has ended." });
      }

      // Check if already joined
      const [existing] = await db
        .select()
        .from(sessionPlayers)
        .where(
          and(
            eq(sessionPlayers.sessionId, input.sessionId),
            eq(sessionPlayers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing) {
        if (!existing.isActive) {
          // Rejoin
          await db
            .update(sessionPlayers)
            .set({ isActive: true })
            .where(eq(sessionPlayers.id, existing.id));
        }
        return { success: true, alreadyJoined: true };
      }

      // Validate invite code if session requires it
      if (input.inviteCode) {
        const [invite] = await db
          .select()
          .from(inviteCodes)
          .where(
            and(
              eq(inviteCodes.code, input.inviteCode),
              eq(inviteCodes.sessionId, input.sessionId)
            )
          )
          .limit(1);

        if (!invite) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid invite code." });
        if (invite.usedBy) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite code already used." });
        if (invite.expiresAt && invite.expiresAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invite code has expired." });
        }

        await db
          .update(inviteCodes)
          .set({ usedBy: ctx.user.id, usedAt: new Date() })
          .where(eq(inviteCodes.id, invite.id));
      }

      // Count existing players for turn order
      const playerCount = await db
        .select({ id: sessionPlayers.id })
        .from(sessionPlayers)
        .where(eq(sessionPlayers.sessionId, input.sessionId));

      await db.insert(sessionPlayers).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        characterId: input.characterId,
        turnOrder: playerCount.length,
        isActive: true,
      });

      // Notify supervisor
      if (session.supervisorId) {
        await addNotification({
          sessionId: session.id,
          sessionTitle: session.title,
          supervisorId: session.supervisorId,
          type: "player_acted",
          playerName: ctx.user.displayName ?? ctx.user.username,
          message: `${ctx.user.displayName ?? ctx.user.username} joined the session.`,
        });
      }

      emitToSession(input.sessionId, {
        type: "player:joined",
        sessionId: input.sessionId,
        payload: { userId: ctx.user.id, username: ctx.user.username, displayName: ctx.user.displayName },
      });

      return { success: true, alreadyJoined: false };
    }),

  getPlayers: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: sessionPlayers.id,
          userId: sessionPlayers.userId,
          characterId: sessionPlayers.characterId,
          turnOrder: sessionPlayers.turnOrder,
          isActive: sessionPlayers.isActive,
          username: users.username,
          displayName: users.displayName,
          charName: characters.name,
          charCallsign: characters.callsign,
          charJobTitle: characters.jobTitle,
          charAvatarUrl: characters.avatarUrl,
          charXp: characters.xp,
        })
        .from(sessionPlayers)
        .leftJoin(users, eq(sessionPlayers.userId, users.id))
        .leftJoin(characters, eq(sessionPlayers.characterId, characters.id))
        .where(eq(sessionPlayers.sessionId, input.sessionId))
        .orderBy(sessionPlayers.turnOrder);

      return rows;
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
        limit: z.number().int().min(1).max(200).default(100),
        before: z.number().int().optional(),
      })
    )
    .query(async ({ input }) => {
      return db
        .select()
        .from(sessionMessages)
        .where(eq(sessionMessages.sessionId, input.sessionId))
        .orderBy(desc(sessionMessages.createdAt))
        .limit(input.limit);
    }),

  submitAction: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
        content: z.string().min(1).max(2000),
        skillName: z.string().optional(),
        skillLevel: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [session] = await db
        .select()
        .from(aiSessions)
        .where(eq(aiSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status === "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Session has ended." });
      }

      // Roll dice if skill provided
      let rollData: { dice: number[]; total: number; skillName: string; skillLevel: number } | null = null;
      if (input.skillName && input.skillLevel) {
        const dice = rollDice(input.skillLevel);
        rollData = {
          dice,
          total: Math.max(...dice),
          skillName: input.skillName,
          skillLevel: input.skillLevel,
        };
      }

      const playerName = ctx.user.displayName ?? ctx.user.username;

      // Save player message
      const [playerMsg] = await db
        .insert(sessionMessages)
        .values({
          sessionId: input.sessionId,
          authorId: ctx.user.id,
          authorType: "player",
          authorName: playerName,
          content: input.content,
          rollData: rollData ? JSON.stringify(rollData) : null,
        })
        .returning();

      emitToSession(input.sessionId, {
        type: "message:new",
        sessionId: input.sessionId,
        payload: playerMsg,
      });

      // Notify supervisor
      if (session.supervisorId) {
        await addNotification({
          sessionId: session.id,
          sessionTitle: session.title,
          supervisorId: session.supervisorId,
          type: "player_acted",
          playerName,
          message: `${playerName} acted: "${input.content.slice(0, 80)}${input.content.length > 80 ? "…" : ""}"`,
        });
      }

      // If supervisor-only mode, return here
      if (session.supervisorId && !process.env.LLM_API_KEY && process.env.LLM_PROVIDER !== "ollama") {
        return { playerMessage: playerMsg, aiMessage: null };
      }

      // Build LLM context
      const recentMessages = await db
        .select()
        .from(sessionMessages)
        .where(eq(sessionMessages.sessionId, input.sessionId))
        .orderBy(desc(sessionMessages.createdAt))
        .limit(20);

      const systemPrompt = `You are the AI Game Master for "Roll for Uptime", a tabletop RPG set in a cyberpunk security operations center called Facility 404. 
Players are security analysts responding to incidents. The system uses Roll for Shoes rules: roll a number of d6 equal to your skill level, take the highest result.
${session.gmNotes ? `\nSession context: ${session.gmNotes}` : ""}
Keep responses concise, atmospheric, and advance the scene. Use markdown for emphasis and lists.`;

      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...recentMessages
          .reverse()
          .slice(-15)
          .map((m) => ({
            role: (m.authorType === "ai" ? "assistant" : "user") as "assistant" | "user",
            content: m.authorType === "player"
              ? `${m.authorName}: ${m.content}${m.rollData ? ` [Roll: ${JSON.parse(m.rollData).total}]` : ""}`
              : m.content,
          })),
      ];

      const aiResponse = await invokeLLM(llmMessages);

      const [aiMsg] = await db
        .insert(sessionMessages)
        .values({
          sessionId: input.sessionId,
          authorType: "ai",
          authorName: "AI GM",
          content: aiResponse,
        })
        .returning();

      emitToSession(input.sessionId, {
        type: "message:new",
        sessionId: input.sessionId,
        payload: aiMsg,
      });

      // Advance turn
      const players = await db
        .select()
        .from(sessionPlayers)
        .where(and(eq(sessionPlayers.sessionId, input.sessionId), eq(sessionPlayers.isActive, true)))
        .orderBy(sessionPlayers.turnOrder);

      if (players.length > 0) {
        const currentIdx = players.findIndex((p) => p.userId === ctx.user.id);
        const nextPlayer = players[(currentIdx + 1) % players.length];

        await db
          .update(aiSessions)
          .set({
            currentTurnUserId: nextPlayer.userId,
            turnDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          })
          .where(eq(aiSessions.id, input.sessionId));

        emitToSession(input.sessionId, {
          type: "turn:changed",
          sessionId: input.sessionId,
          payload: { currentTurnUserId: nextPlayer.userId },
        });

        if (session.supervisorId && nextPlayer.userId !== ctx.user.id) {
          const [nextUser] = await db
            .select({ displayName: users.displayName, username: users.username })
            .from(users)
            .where(eq(users.id, nextPlayer.userId))
            .limit(1);

          const nextName = nextUser?.displayName ?? nextUser?.username ?? "Unknown";
          await addNotification({
            sessionId: session.id,
            sessionTitle: session.title,
            supervisorId: session.supervisorId,
            type: "turn_waiting",
            playerName: nextName,
            message: `Waiting on ${nextName} for their turn.`,
          });
        }
      }

      return { playerMessage: playerMsg, aiMessage: aiMsg };
    }),

  supervisorRespond: adminProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
        content: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [session] = await db
        .select()
        .from(aiSessions)
        .where(eq(aiSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const [msg] = await db
        .insert(sessionMessages)
        .values({
          sessionId: input.sessionId,
          authorId: ctx.user.id,
          authorType: "gm",
          authorName: ctx.user.displayName ?? "Supervisor",
          content: input.content,
        })
        .returning();

      emitToSession(input.sessionId, {
        type: "message:new",
        sessionId: input.sessionId,
        payload: msg,
      });

      return msg;
    }),

  skipTurn: adminProcedure
    .input(z.object({ sessionId: z.number().int(), userId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const [session] = await db
        .select()
        .from(aiSessions)
        .where(eq(aiSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const players = await db
        .select()
        .from(sessionPlayers)
        .where(and(eq(sessionPlayers.sessionId, input.sessionId), eq(sessionPlayers.isActive, true)))
        .orderBy(sessionPlayers.turnOrder);

      const currentIdx = players.findIndex((p) => p.userId === input.userId);
      const nextPlayer = players[(currentIdx + 1) % players.length];

      await db
        .update(aiSessions)
        .set({
          currentTurnUserId: nextPlayer.userId,
          turnDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(aiSessions.id, input.sessionId));

      const [skippedUser] = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      const skippedName = skippedUser?.displayName ?? skippedUser?.username ?? "Unknown";

      await db.insert(sessionMessages).values({
        sessionId: input.sessionId,
        authorType: "system",
        authorName: "System",
        content: `⏭ ${skippedName}'s turn was skipped by the supervisor.`,
      });

      if (session.supervisorId) {
        await addNotification({
          sessionId: session.id,
          sessionTitle: session.title,
          supervisorId: session.supervisorId,
          type: "turn_skipped",
          playerName: skippedName,
          message: `Turn skipped for ${skippedName}.`,
        });
      }

      emitToSession(input.sessionId, {
        type: "turn:changed",
        sessionId: input.sessionId,
        payload: { currentTurnUserId: nextPlayer.userId },
      });

      return { success: true };
    }),

  kickPlayer: adminProcedure
    .input(z.object({ sessionId: z.number().int(), userId: z.number().int(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const [session] = await db
        .select()
        .from(aiSessions)
        .where(eq(aiSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(sessionPlayers)
        .set({ isActive: false })
        .where(
          and(
            eq(sessionPlayers.sessionId, input.sessionId),
            eq(sessionPlayers.userId, input.userId)
          )
        );

      const [kickedUser] = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      const kickedName = kickedUser?.displayName ?? kickedUser?.username ?? "Unknown";
      const reason = input.reason ?? "inactivity";

      await db.insert(sessionMessages).values({
        sessionId: input.sessionId,
        authorType: "system",
        authorName: "System",
        content: `🚫 ${kickedName} was removed from the session (${reason}).`,
      });

      if (session.supervisorId) {
        await addNotification({
          sessionId: session.id,
          sessionTitle: session.title,
          supervisorId: session.supervisorId,
          type: "player_kicked",
          playerName: kickedName,
          message: `${kickedName} was removed from the session (${reason}).`,
        });
      }

      emitToSession(input.sessionId, {
        type: "player:left",
        sessionId: input.sessionId,
        payload: { userId: input.userId, reason },
      });

      return { success: true };
    }),

  endSession: adminProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ input }) => {
      await db
        .update(aiSessions)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(aiSessions.id, input.sessionId));

      emitToSession(input.sessionId, {
        type: "session:updated",
        sessionId: input.sessionId,
        payload: { status: "completed" },
      });

      return { success: true };
    }),

  generateInviteCode: adminProcedure
    .input(z.object({ sessionId: z.number().int(), expiresInHours: z.number().int().min(1).max(168).default(24) }))
    .mutation(async ({ input, ctx }) => {
      const code = Array.from({ length: 8 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(0, 32)]
      ).join("");

      const [invite] = await db
        .insert(inviteCodes)
        .values({
          code,
          sessionId: input.sessionId,
          createdBy: ctx.user.id,
          expiresAt: new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000),
        })
        .returning();

      return invite;
    }),

  // Supervisor notifications
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx }) => {
      return db
        .select()
        .from(supervisorNotifications)
        .where(eq(supervisorNotifications.supervisorUserId, ctx.user.id))
        .orderBy(desc(supervisorNotifications.createdAt))
        .limit(ctx.input?.limit ?? 50);
    }),

  markNotificationsRead: protectedProcedure
    .input(z.object({ ids: z.array(z.number().int()).optional() }))
    .mutation(async ({ input, ctx }) => {
      if (input.ids && input.ids.length > 0) {
        await db
          .update(supervisorNotifications)
          .set({ isRead: true })
          .where(
            and(
              eq(supervisorNotifications.supervisorUserId, ctx.user.id),
              inArray(supervisorNotifications.id, input.ids)
            )
          );
      } else {
        await db
          .update(supervisorNotifications)
          .set({ isRead: true })
          .where(eq(supervisorNotifications.supervisorUserId, ctx.user.id));
      }
      return { success: true };
    }),
});
