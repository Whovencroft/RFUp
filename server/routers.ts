import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getCharacterByUserId,
  createCharacter,
  updateCharacter,
  getAllCharacters,
  getSkillsByCharacterId,
  addSkill,
  getAllIncidents,
  getActiveIncidents,
  createIncident,
  updateIncident,
  getRecentSessionLog,
  addSessionLogEntry,
  seedIncidentsIfEmpty,
  getAllUsers,
  setUserRole,
} from "./db";

// ── Admin guard ────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Shift Supervisor access required." });
  }
  return next({ ctx });
});

// ── Helpers ────────────────────────────────────────────────────────────────
function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Character ────────────────────────────────────────────────────────────
  character: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const char = await getCharacterByUserId(ctx.user.id);
      if (!char) return null;
      const charSkills = await getSkillsByCharacterId(char.id);
      return { ...char, skills: charSkills };
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(128), jobTitle: z.string().min(1).max(128) }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getCharacterByUserId(ctx.user.id);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Character already exists." });
        const char = await createCharacter({ userId: ctx.user.id, name: input.name, jobTitle: input.jobTitle, xp: 0 });
        if (!char) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Seed starting skill
        await addSkill({ characterId: char.id, name: "Do Anything", level: 1 });
        // Log
        await addSessionLogEntry({
          userId: ctx.user.id,
          characterName: char.name,
          eventType: "roll",
          description: `${char.name} (${char.jobTitle}) has clocked in for their shift at Facility 404.`,
        });
        const charSkills = await getSkillsByCharacterId(char.id);
        return { ...char, skills: charSkills };
      }),

    update: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(128).optional(), jobTitle: z.string().min(1).max(128).optional() }))
      .mutation(async ({ ctx, input }) => {
        const char = await getCharacterByUserId(ctx.user.id);
        if (!char) throw new TRPCError({ code: "NOT_FOUND" });
        await updateCharacter(char.id, input);
        return { success: true };
      }),
  }),

  // ── Dice ─────────────────────────────────────────────────────────────────
  dice: router({
    roll: protectedProcedure
      .input(
        z.object({
          skillName: z.string(),
          skillLevel: z.number().int().min(1).max(10),
          xpToSpend: z.number().int().min(0).default(0),
          opposingRoll: z.number().int().min(2).default(7),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const char = await getCharacterByUserId(ctx.user.id);
        if (!char) throw new TRPCError({ code: "NOT_FOUND", message: "No character found." });

        // Validate XP spend
        if (input.xpToSpend > char.xp) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough XP." });
        }

        let dice = rollDice(input.skillLevel);

        // XP converts lowest dice to 6s (advancement only — per Roll for Shoes rules)
        if (input.xpToSpend > 0) {
          // Find indices of the lowest dice values and convert them to 6
          const indexedDice = dice.map((val, idx) => ({ val, idx }));
          indexedDice.sort((a, b) => a.val - b.val);
          const indicesToBoost = indexedDice.slice(0, input.xpToSpend).map((d) => d.idx);
          dice = dice.map((val, idx) => indicesToBoost.includes(idx) ? 6 : val);
          await updateCharacter(char.id, { xp: char.xp - input.xpToSpend });
        }

        const sum = dice.reduce((a, b) => a + b, 0);
        const allSixes = dice.every((d) => d === 6);
        const success = sum > input.opposingRoll;

        // Award XP on failure
        if (!success) {
          await updateCharacter(char.id, { xp: char.xp - input.xpToSpend + 1 });
          await addSessionLogEntry({
            userId: ctx.user.id,
            characterName: char.name,
            eventType: "xp_awarded",
            description: `${char.name} failed a ${input.skillName} roll and earned 1 XP. (Total: ${char.xp - input.xpToSpend + 1} XP)`,
            metadata: JSON.stringify({ dice, sum, opposingRoll: input.opposingRoll }),
          });
        }

        if (input.xpToSpend > 0) {
          await addSessionLogEntry({
            userId: ctx.user.id,
            characterName: char.name,
            eventType: "xp_spent",
            description: `${char.name} spent ${input.xpToSpend} XP to boost a ${input.skillName} roll.`,
          });
        }

        // Log the roll
        await addSessionLogEntry({
          userId: ctx.user.id,
          characterName: char.name,
          eventType: "roll",
          description: `${char.name} rolled ${input.skillLevel}d6 for "${input.skillName}" — [${dice.join(", ")}] = ${sum} vs difficulty ${input.opposingRoll}. ${success ? "SUCCESS" : "FAILURE"}${allSixes ? " 🎲 ALL SIXES!" : ""}`,
          metadata: JSON.stringify({ dice, sum, skillName: input.skillName, skillLevel: input.skillLevel, opposingRoll: input.opposingRoll, success, allSixes }),
        });

        return { dice, sum, success, allSixes, newXp: success ? char.xp - input.xpToSpend : char.xp - input.xpToSpend + 1 };
      }),
  }),

  // ── Skills ───────────────────────────────────────────────────────────────
  skills: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const char = await getCharacterByUserId(ctx.user.id);
      if (!char) return [];
      return getSkillsByCharacterId(char.id);
    }),

    add: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(256), level: z.number().int().min(1).max(10) }))
      .mutation(async ({ ctx, input }) => {
        const char = await getCharacterByUserId(ctx.user.id);
        if (!char) throw new TRPCError({ code: "NOT_FOUND" });
        const skill = await addSkill({ characterId: char.id, name: input.name, level: input.level });
        await addSessionLogEntry({
          userId: ctx.user.id,
          characterName: char.name,
          eventType: "skill_gained",
          description: `${char.name} gained a new skill: "${input.name} ${input.level}" — all dice showed 6!`,
        });
        return skill;
      }),
  }),

  // ── XP ───────────────────────────────────────────────────────────────────
  xp: router({
    spend: protectedProcedure
      .input(z.object({ amount: z.number().int().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const char = await getCharacterByUserId(ctx.user.id);
        if (!char) throw new TRPCError({ code: "NOT_FOUND" });
        if (char.xp < input.amount) throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough XP." });
        await updateCharacter(char.id, { xp: char.xp - input.amount });
        await addSessionLogEntry({
          userId: ctx.user.id,
          characterName: char.name,
          eventType: "xp_spent",
          description: `${char.name} spent ${input.amount} XP.`,
        });
        return { newXp: char.xp - input.amount };
      }),
  }),

  // ── Incidents ─────────────────────────────────────────────────────────────
  incidents: router({
    list: publicProcedure.query(async () => {
      await seedIncidentsIfEmpty();
      return getAllIncidents();
    }),

    active: publicProcedure.query(async () => {
      return getActiveIncidents();
    }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(256),
          description: z.string().min(1),
          difficulty: z.number().int().min(2).max(20).default(7),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createIncident({ ...input, createdBy: ctx.user.id });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int(),
          title: z.string().min(1).max(256).optional(),
          description: z.string().min(1).optional(),
          difficulty: z.number().int().min(2).max(20).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateIncident(id, data);
        if (data.isActive) {
          await addSessionLogEntry({
            userId: ctx.user.id,
            characterName: "Shift Supervisor",
            eventType: "incident_activated",
            description: `Shift Supervisor activated a new incident.`,
          });
        }
        return { success: true };
      }),

    allForGm: adminProcedure.query(async () => {
      await seedIncidentsIfEmpty();
      return getAllIncidents();
    }),
  }),

  // ── Session Log ───────────────────────────────────────────────────────────
  sessionLog: router({
    recent: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
      .query(async ({ input }) => {
        return getRecentSessionLog(input?.limit ?? 50);
      }),
  }),  // ── GM: All player sheets + user management ─────────────────────────────────
  gm: router({
    allSheets: adminProcedure.query(async () => {
      const chars = await getAllCharacters();
      const withSkills = await Promise.all(
        chars.map(async (c) => ({ ...c, skills: await getSkillsByCharacterId(c.id) }))
      );
      return withSkills;
    }),

    listUsers: adminProcedure.query(async () => {
      return getAllUsers();
    }),

    setRole: adminProcedure
      .input(
        z.object({
          userId: z.number().int(),
          role: z.enum(["user", "admin"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Prevent self-demotion so there's always at least one admin
        if (input.userId === ctx.user.id && input.role === "user") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot remove your own Shift Supervisor access.",
          });
        }
        await setUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
