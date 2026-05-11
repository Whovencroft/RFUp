import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../trpc.js";
import { getTheme, setTheme, applyPreset, THEME_PRESETS, ThemeConfig } from "../theme.js";
import { getSetting, setSetting } from "./admin.js";

const themeKeys = [
  "gameName","tagline","settingName","settingShortName","welcomeMessage",
  "operatorLabel","operatorPluralLabel","operatorFileLabel",
  "supervisorLabel","supervisorPluralLabel",
  "skillLabel","skillPluralLabel","xpLabel","xpFullLabel",
  "incidentLabel","incidentPluralLabel","sessionLabel","sessionPluralLabel",
  "actionLabel","rollLabel","activeStatusLabel","inactiveStatusLabel",
  "joinLabel","leaveLabel","commendationLabel","commendationPluralLabel",
  "defaultJobTitle","aiGmName","aiGmDescription","accentColor","accentColorDark",
] as const;

export const adminThemeRouter = router({
  // Public — any logged-in user can fetch the current theme
  getTheme: publicProcedure.query(() => {
    return getTheme();
  }),

  // Public — list available presets
  listPresets: publicProcedure.query(() => {
    return Object.keys(THEME_PRESETS).map((key) => ({
      key,
      gameName: THEME_PRESETS[key].gameName,
      tagline: THEME_PRESETS[key].tagline,
      accentColor: THEME_PRESETS[key].accentColor,
    }));
  }),

  // Admin — apply a preset
  applyPreset: adminProcedure
    .input(z.object({ presetKey: z.string() }))
    .mutation(async ({ input }) => {
      const theme = applyPreset(input.presetKey);
      // Persist all keys
      for (const key of themeKeys) {
        await setSetting(`theme_${key}`, theme[key as keyof ThemeConfig] as string);
      }
      await setSetting("theme_preset", input.presetKey);
      return theme;
    }),

  // Admin — update individual theme fields
  updateTheme: adminProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(async ({ input }) => {
      const updates: Partial<ThemeConfig> = {};
      for (const [k, v] of Object.entries(input)) {
        if (themeKeys.includes(k as typeof themeKeys[number])) {
          (updates as Record<string, string>)[k] = v;
          await setSetting(`theme_${k}`, v);
        }
      }
      setTheme(updates);
      await setSetting("theme_preset", "custom");
      return getTheme();
    }),
});

// ─── Load persisted theme on startup ─────────────────────────────────────────
export async function loadPersistedTheme() {
  try {
    const preset = await getSetting("theme_preset");
    if (preset && preset !== "custom" && THEME_PRESETS[preset]) {
      applyPreset(preset);
    } else {
      // Load individual keys
      const updates: Partial<ThemeConfig> = {};
      for (const key of themeKeys) {
        const val = await getSetting(`theme_${key}`);
        if (val) (updates as Record<string, string>)[key] = val;
      }
      if (Object.keys(updates).length > 0) setTheme(updates);
    }
  } catch {
    // First run — use defaults
  }
}
