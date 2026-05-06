import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { characters, skills } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { generatePortrait } from "../llm.js";
import { downloadAndSavePortrait } from "../storage.js";
import { randomInt } from "crypto";

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => randomInt(1, 7));
}

export const characterRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [char] = await db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.user.id))
      .limit(1);
    if (!char) return null;

    const charSkills = await db
      .select()
      .from(skills)
      .where(eq(skills.characterId, char.id));

    return { ...char, skills: charSkills };
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        callsign: z.string().max(32).optional(),
        jobTitle: z.string().min(1).max(64).default("Security Analyst"),
        bio: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You already have an operator file." });
      }

      const [char] = await db
        .insert(characters)
        .values({
          userId: ctx.user.id,
          name: input.name,
          callsign: input.callsign,
          jobTitle: input.jobTitle,
          bio: input.bio,
        })
        .returning();

      // Seed starting skill
      await db.insert(skills).values({
        characterId: char.id,
        name: input.jobTitle,
        level: 1,
      });

      return char;
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64).optional(),
        callsign: z.string().max(32).optional(),
        jobTitle: z.string().min(1).max(64).optional(),
        bio: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(characters)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(characters.userId, ctx.user.id));
      return { success: true };
    }),

  generateAvatar: protectedProcedure
    .input(
      z.object({
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [char] = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.user.id))
        .limit(1);

      if (!char) throw new TRPCError({ code: "NOT_FOUND", message: "No operator file found." });

      const remoteUrl = await generatePortrait({
        name: char.name,
        callsign: char.callsign,
        jobTitle: char.jobTitle,
        description: input.description,
      });

      if (!remoteUrl) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Image generation is not configured. Set IMAGE_API_KEY and IMAGE_PROVIDER in your .env file.",
        });
      }

      // Download and save locally
      const localUrl = await downloadAndSavePortrait(remoteUrl);

      await db
        .update(characters)
        .set({ avatarUrl: localUrl, avatarPrompt: input.description, updatedAt: new Date() })
        .where(eq(characters.userId, ctx.user.id));

      return { avatarUrl: localUrl };
    }),

  rollDice: protectedProcedure
    .input(
      z.object({
        skillName: z.string(),
        skillLevel: z.number().int().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const dice = rollDice(input.skillLevel);
      const total = Math.max(...dice);
      return { dice, total, skillName: input.skillName, skillLevel: input.skillLevel };
    }),

  addSkill: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        parentSkillId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [char] = await db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.userId, ctx.user.id))
        .limit(1);

      if (!char) throw new TRPCError({ code: "NOT_FOUND" });

      const [skill] = await db
        .insert(skills)
        .values({
          characterId: char.id,
          name: input.name,
          level: 1,
          parentSkillId: input.parentSkillId,
        })
        .returning();

      return skill;
    }),

  levelUpSkill: protectedProcedure
    .input(z.object({ skillId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const [char] = await db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.userId, ctx.user.id))
        .limit(1);

      if (!char) throw new TRPCError({ code: "NOT_FOUND" });

      const [skill] = await db
        .select()
        .from(skills)
        .where(and(eq(skills.id, input.skillId), eq(skills.characterId, char.id)))
        .limit(1);

      if (!skill) throw new TRPCError({ code: "NOT_FOUND" });

      const cost = skill.level + 1;
      const [updatedChar] = await db
        .select({ xp: characters.xp })
        .from(characters)
        .where(eq(characters.id, char.id))
        .limit(1);

      if (updatedChar.xp < cost) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Need ${cost} XP to level up this skill.` });
      }

      await db
        .update(characters)
        .set({ xp: updatedChar.xp - cost, updatedAt: new Date() })
        .where(eq(characters.id, char.id));

      await db
        .update(skills)
        .set({ level: skill.level + 1 })
        .where(eq(skills.id, skill.id));

      return { success: true, newLevel: skill.level + 1 };
    }),

  getSessionHistory: protectedProcedure.query(async ({ ctx }) => {
    const { sessionMessages, aiSessions, sessionPlayers } = await import("../db/schema.js");
    const playerSessions = await db
      .select({ sessionId: sessionPlayers.sessionId })
      .from(sessionPlayers)
      .where(eq(sessionPlayers.userId, ctx.user.id));

    if (playerSessions.length === 0) return [];

    const sessionIds = playerSessions.map((p) => p.sessionId);
    const sessions = await db
      .select()
      .from(aiSessions)
      .where(
        sessionIds.length === 1
          ? eq(aiSessions.id, sessionIds[0])
          : // @ts-ignore — drizzle inList
            (await import("drizzle-orm")).inArray(aiSessions.id, sessionIds)
      );

    return sessions;
  }),
});
