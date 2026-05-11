import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { users, inviteCodes } from "../db/schema.js";
import { eq, desc, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export const adminUsersRouter = router({
  // List all users
  listUsers: adminProcedure.query(async () => {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return rows;
  }),

  // Promote/demote role or activate/deactivate
  updateUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["admin", "user"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new Error("You cannot modify your own account.");
      }
      const updates: Partial<typeof users.$inferInsert> = {};
      if (input.role !== undefined) updates.role = input.role;
      if (input.isActive !== undefined) updates.isActive = input.isActive;
      await db.update(users).set(updates).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Admin reset password for any user
  resetPassword: adminProcedure
    .input(z.object({
      userId: z.number(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input }) => {
      const hash = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ passwordHash: hash }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Create a registration invite link (no sessionId)
  createRegistrationInvite: adminProcedure
    .input(z.object({
      expiresInHours: z.number().min(1).max(720).optional(), // up to 30 days
    }))
    .mutation(async ({ ctx, input }) => {
      const code = randomBytes(16).toString("hex");
      const expiresAt = input.expiresInHours
        ? new Date(Date.now() + input.expiresInHours * 3600 * 1000)
        : null;
      await db.insert(inviteCodes).values({
        code,
        inviteType: "registration",
        createdBy: ctx.user.id,
        expiresAt: expiresAt ?? undefined,
      });
      return { code, expiresAt };
    }),

  // List all registration invites
  listRegistrationInvites: adminProcedure.query(async () => {
    const rows = await db
      .select({
        id: inviteCodes.id,
        code: inviteCodes.code,
        createdAt: inviteCodes.createdAt,
        expiresAt: inviteCodes.expiresAt,
        usedAt: inviteCodes.usedAt,
        usedBy: inviteCodes.usedBy,
      })
      .from(inviteCodes)
      .where(eq(inviteCodes.inviteType, "registration"))
      .orderBy(desc(inviteCodes.createdAt));
    return rows;
  }),

  // Revoke (delete) an invite
  revokeInvite: adminProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(inviteCodes).where(eq(inviteCodes.id, input.inviteId));
      return { success: true };
    }),
});
