import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { incidents, incidentLibrary } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

export const incidentsRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(incidents).orderBy(desc(incidents.createdAt));
  }),

  active: publicProcedure.query(async () => {
    return db.select().from(incidents).where(eq(incidents.isActive, true)).orderBy(desc(incidents.createdAt));
  }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(128),
        description: z.string().min(1).max(2000),
        severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        dc: z.number().int().min(1).max(6).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [incident] = await db
        .insert(incidents)
        .values({ ...input, createdBy: ctx.user.id })
        .returning();
      return incident;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        title: z.string().min(1).max(128).optional(),
        description: z.string().min(1).max(2000).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        dc: z.number().int().min(1).max(6).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(incidents).set(data).where(eq(incidents.id, id));
      return { success: true };
    }),

  // Incident library (templates)
  libraryList: publicProcedure.query(async () => {
    return db.select().from(incidentLibrary).orderBy(desc(incidentLibrary.createdAt));
  }),

  libraryCreate: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(128),
        description: z.string().min(1).max(2000),
        severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        dc: z.number().int().min(1).max(6).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [entry] = await db
        .insert(incidentLibrary)
        .values({
          ...input,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          createdBy: ctx.user.id,
        })
        .returning();
      return entry;
    }),
});
