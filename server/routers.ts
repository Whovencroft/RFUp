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
  getAllCharactersWithSkills,
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
  clearSessionLog,
  createAiSession,
  getAiSession,
  listAiSessions,
  updateAiSession,
  addAiMessage,
  getAiMessages,
} from "./db";
import { invokeLLM } from "./_core/llm";

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

    listAll: protectedProcedure.query(async () => {
      return getAllCharactersWithSkills();
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

    // AI suggests a new skill name based on the player's action and existing skills
    suggestName: protectedProcedure
      .input(z.object({
        actionDescription: z.string(),
        usedSkillName: z.string(),
        usedSkillLevel: z.number().int(),
      }))
      .mutation(async ({ ctx, input }) => {
        const char = await getCharacterByUserId(ctx.user.id);
        if (!char) throw new TRPCError({ code: "NOT_FOUND" });
        const existingSkills = await getSkillsByCharacterId(char.id);
        const skillList = existingSkills.map((s) => `"${s.name} ${s.level}"`).join(", ");
        const newLevel = input.usedSkillLevel + 1;
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are the AI Shift Supervisor for Facility 404, a data center security tabletop RPG using the Roll for Shoes system. In Roll for Shoes, each new skill must be MORE SPECIFIC than the skill it derives from. Skills are named descriptively and tied to specific actions. A skill named "Do Anything 1" can spawn "Badge Reader Expertise 2" or "Aggressive Visitor De-escalation 2". A skill named "Badge Reader Expertise 2" might spawn "Override Tailgating Lockout Protocol 3". The new skill should be funny, specific, and grounded in data center security operations. It should clearly derive from the action the player just took. Return ONLY the skill name, no quotes, no explanation, no punctuation at the end. The name should be 3-6 words. Do not include the level number in the name.`,
            },
            {
              role: "user",
              content: `The player's character is "${char.name}" (${char.jobTitle}). Their existing skills are: ${skillList || '"Do Anything 1"'}. They just used "${input.usedSkillName} ${input.usedSkillLevel}" and rolled all 6s while doing this: "${input.actionDescription}". Suggest a new skill name at level ${newLevel} that is more specific than "${input.usedSkillName}" and directly inspired by this action.`,
            },
          ],
        });
        const suggested = (response.choices[0]?.message?.content as string ?? "").trim();
        return { suggestedName: suggested, level: newLevel };
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

    clearSessionLog: adminProcedure.mutation(async () => {
      await clearSessionLog();
      return { success: true };
    }),
  }),

  // ── AI Shift Supervisor ───────────────────────────────────────────────────
  aiGm: router({
    // List all AI sessions (admin sees all, players see active ones they're in)
    listSessions: protectedProcedure.query(async () => {
      return listAiSessions();
    }),

    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number().int() }))
      .query(async ({ input }) => {
        const session = await getAiSession(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        return session;
      }),

    getMessages: protectedProcedure
      .input(z.object({ sessionId: z.number().int() }))
      .query(async ({ input }) => {
        return getAiMessages(input.sessionId);
      }),

    // GM creates a new AI-run session
    createSession: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(256),
          incitingIncidentId: z.number().int().optional(),
          playerUserIds: z.array(z.number().int()).min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await seedIncidentsIfEmpty();
        const allIncidents = await getAllIncidents();

        // Pick inciting incident
        let incident = allIncidents.find((i) => i.id === input.incitingIncidentId);
        if (!incident) {
          // AI picks one at random
          incident = allIncidents[Math.floor(Math.random() * allIncidents.length)];
        }
        if (!incident) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No incidents available." });

        // Fetch player characters
        const playerChars = await Promise.all(
          input.playerUserIds.map(async (uid) => {
            const char = await getCharacterByUserId(uid);
            if (!char) return null;
            const charSkills = await getSkillsByCharacterId(char.id);
            return { ...char, skills: charSkills };
          })
        );
        const validPlayers = playerChars.filter(Boolean) as NonNullable<typeof playerChars[0]>[];
        if (validPlayers.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "None of the selected players have characters." });
        }

        const session = await createAiSession({
          title: input.title,
          incitingIncidentId: incident.id,
          playerOrder: JSON.stringify(validPlayers.map((p) => p.userId)),
          currentTurnUserId: validPlayers[0]!.userId,
          createdBy: ctx.user.id,
        });

        // Build opening narration
        const playerRoster = validPlayers
          .map((p) => `- ${p.name} (${p.jobTitle}), skills: ${p.skills.map((s) => `${s.name} ${s.level}`).join(", ")}`)
          .join("\n");

        const openingPrompt = `You are the AI Shift Supervisor running a play-by-post tabletop RPG called "Roll for Uptime" set in Facility 404, a data center where mundane security work occasionally intersects with the inexplicable.

SYSTEM RULES (follow these exactly):
- Players roll D6s equal to their skill level. Sum must beat the DC you set to succeed.
- DC range: 4 (trivial) to 14 (nearly impossible). Typical: 6-9.
- On failure, player earns 1 XP. They can spend XP to convert a die to a 6 for advancement rolls only.
- If ALL dice show 6, player gains a new skill more specific than the one used.
- You adjudicate whether a skill is applicable. Be creative but fair — if a player makes a compelling case, let them roll.
- Failures make things worse in a mundane or absurd way. Not fatal, just worse.
- After each player's turn, advance to the next player in the roster.
- Chain incidents naturally — one problem leads to another. The shift never gets simpler.
- Tone: dry, bureaucratic, slightly absurd. The incident report will be thorough.

PLAYER ROSTER:
${playerRoster}

INCITING INCIDENT:
Title: ${incident.title}
Description: ${incident.description}
Base difficulty: ${incident.difficulty}

Your opening message should:
1. Set the scene at Facility 404 in 2-3 sentences.
2. Describe the inciting incident as it presents itself to the team.
3. Address the first player by their character name and ask what they do.
4. Do NOT roll dice yourself. Do NOT resolve anything yet.

Keep it under 200 words. Write in second person ("you"). Dry, grounded tone.`;

        const llmResponse = await invokeLLM({
          messages: [{ role: "user", content: openingPrompt }],
        });

        const openingText = String(llmResponse.choices[0]?.message?.content ?? "The shift begins.");

        await addAiMessage({
          sessionId: session.id,
          authorType: "ai",
          authorName: "AI Shift Supervisor",
          content: openingText,
          isIncidentChain: false,
        });

        return { session, openingText };
      }),

    // Player submits their action and dice results
    submitAction: protectedProcedure
      .input(
        z.object({
          sessionId: z.number().int(),
          actionDescription: z.string().min(1).max(1000),
          skillName: z.string().min(1).max(256),
          skillLevel: z.number().int().min(1).max(10),
          diceResults: z.array(z.number().int().min(1).max(6)),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const session = await getAiSession(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (session.status === "ended") throw new TRPCError({ code: "BAD_REQUEST", message: "This session has ended." });

        // Enforce turn order
        if (session.currentTurnUserId !== ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "It's not your turn yet.",
          });
        }

        const char = await getCharacterByUserId(ctx.user.id);
        if (!char) throw new TRPCError({ code: "NOT_FOUND", message: "No character found." });
        const charSkills = await getSkillsByCharacterId(char.id);

        const rollTotal = input.diceResults.reduce((a, b) => a + b, 0);
        const allSixes = input.diceResults.every((d) => d === 6);

        // Save player message
        const rollData = JSON.stringify({
          dice: input.diceResults,
          total: rollTotal,
          skillName: input.skillName,
          skillLevel: input.skillLevel,
        });

        await addAiMessage({
          sessionId: input.sessionId,
          authorType: "player",
          authorId: ctx.user.id,
          authorName: char.name,
          content: input.actionDescription,
          rollData,
        });

        // Fetch full message history for context
        const history = await getAiMessages(input.sessionId, 40);
        const playerOrder: number[] = JSON.parse(session.playerOrder || "[]");

        // Fetch all player characters for context
        const allPlayerChars = await Promise.all(
          playerOrder.map(async (uid) => {
            const c = await getCharacterByUserId(uid);
            if (!c) return null;
            const s = await getSkillsByCharacterId(c.id);
            return { ...c, skills: s };
          })
        );
        const validPlayers = allPlayerChars.filter(Boolean) as NonNullable<typeof allPlayerChars[0]>[];

        const playerRoster = validPlayers
          .map((p) => `- ${p.name} (${p.jobTitle}), skills: ${p.skills.map((s) => `${s.name} ${s.level}`).join(", ")}, XP: ${p.xp}`)
          .join("\n");

        // Build conversation history for LLM
        const conversationHistory = history.slice(-20).map((m) => ({
          role: (m.authorType === "ai" ? "assistant" : "user") as "assistant" | "user",
          content: m.authorType === "player"
            ? `[${m.authorName}]: ${m.content}${m.rollData ? ` [ROLL: ${JSON.parse(m.rollData).dice.join(",")} = ${JSON.parse(m.rollData).total}]` : ""}`
            : m.content,
        }));

        const systemPrompt = `You are the AI Shift Supervisor running "Roll for Uptime" at Facility 404.

SYSTEM RULES:
- Adjudicate whether the player's stated skill ("${input.skillName} ${input.skillLevel}") is applicable to their described action.
- If applicable: the roll total is ${rollTotal} (dice: [${input.diceResults.join(", ")}]). Set a DC between 4-14 appropriate to the difficulty. Narrate success or failure.
- If not applicable: explain why briefly, tell them what skill level they'd roll at (usually Do Anything 1), and ask them to reroll if needed.
- If all dice showed 6 (${allSixes ? "YES — all sixes this roll" : "no"}): prompt the player to name a new, more specific skill.
- On failure: make things worse in a mundane or absurd way. Award them 1 XP (note this in your response).
- After resolving this player's action, address the NEXT player in turn order by name and describe what they see/face.
- You may introduce a new complication or chained incident if narratively appropriate.
- Keep responses under 250 words. Dry, bureaucratic tone with occasional absurdity.

PLAYER ROSTER:
${playerRoster}

CURRENT PLAYER: ${char.name} (${char.jobTitle})
ACTION: ${input.actionDescription}
SKILL USED: ${input.skillName} ${input.skillLevel}
ROLL: [${input.diceResults.join(", ")}] = ${rollTotal}
ALL SIXES: ${allSixes}

TURN ORDER: ${validPlayers.map((p) => p.name).join(" → ")}
NEXT PLAYER AFTER THIS: ${(() => {
  const idx = playerOrder.indexOf(ctx.user.id);
  const nextUid = playerOrder[(idx + 1) % playerOrder.length];
  const nextChar = validPlayers.find((p) => p.userId === nextUid);
  return nextChar ? nextChar.name : "unknown";
})()}

Context summary: ${session.contextSummary ?? "Session just started."}`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...conversationHistory,
        ];

        const llmResponse = await invokeLLM({ messages });
        const aiText = String(llmResponse.choices[0]?.message?.content ?? "The Shift Supervisor reviews the situation.");

        // Detect if AI introduced a new incident (simple heuristic: look for "INCIDENT:" marker)
        const isChain = aiText.includes("[NEW INCIDENT]") || aiText.includes("INCIDENT CHAIN");

        // Determine DC from AI response (look for pattern like "DC 8" or "difficulty 8")
        const dcMatch = aiText.match(/\bDC[:\s]*(\d+)|\bdifficulty[:\s]*(\d+)/i);
        const dcSet = dcMatch ? parseInt(dcMatch[1] ?? dcMatch[2] ?? "7") : null;

        // Determine skill ruling
        const lowerText = aiText.toLowerCase();
        let skillRuling: "approved" | "denied" | "partial" = "approved";
        if (lowerText.includes("not applicable") || lowerText.includes("doesn't apply") || lowerText.includes("does not apply")) {
          skillRuling = "denied";
        } else if (lowerText.includes("partially") || lowerText.includes("stretch") || lowerText.includes("generous")) {
          skillRuling = "partial";
        }

        await addAiMessage({
          sessionId: input.sessionId,
          authorType: "ai",
          authorName: "AI Shift Supervisor",
          content: aiText,
          dcSet: dcSet ?? undefined,
          skillRuling,
          isIncidentChain: isChain,
        });

        // Advance turn order
        const currentIdx = playerOrder.indexOf(ctx.user.id);
        const nextUserId = playerOrder[(currentIdx + 1) % playerOrder.length];
        await updateAiSession(input.sessionId, { currentTurnUserId: nextUserId });

        // Update context summary periodically (every 5 messages)
        if (history.length % 5 === 0) {
          const summaryPrompt = `Summarize the current state of this Roll for Uptime session in 3-4 sentences for context: what incident(s) are active, what has happened, what complications have arisen. Be factual and brief.`;
          const summaryResponse = await invokeLLM({
            messages: [
              ...messages,
              { role: "assistant" as const, content: aiText },
              { role: "user" as const, content: summaryPrompt },
            ],
          });
          const summary = summaryResponse.choices[0]?.message?.content;
          if (summary) await updateAiSession(input.sessionId, { contextSummary: String(summary) });
        }

        return {
          aiResponse: aiText,
          dcSet,
          skillRuling,
          allSixes,
          nextTurnUserId: nextUserId,
        };
      }),

    // GM ends the session
    endSession: adminProcedure
      .input(z.object({ sessionId: z.number().int() }))
      .mutation(async ({ input }) => {
        await updateAiSession(input.sessionId, { status: "ended" });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
