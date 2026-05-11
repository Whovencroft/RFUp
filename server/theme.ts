/**
 * game.config.ts — Theme System
 * All flavor strings that make the game feel like a specific setting.
 * Swap the preset to change the entire game's vocabulary.
 */

export interface ThemeConfig {
  // Identity
  gameName: string;           // "Roll for Uptime"
  tagline: string;            // "Keep the lights on. Whatever it takes."
  settingName: string;        // "Facility 404"
  settingShortName: string;   // "F-404"
  welcomeMessage: string;     // "Welcome to Facility 404. Clock in."

  // Character labels
  operatorLabel: string;      // "Operator"
  operatorPluralLabel: string;// "Operators"
  operatorFileLabel: string;  // "Operator File"
  supervisorLabel: string;    // "Shift Supervisor"
  supervisorPluralLabel: string; // "Shift Supervisors"

  // Gameplay labels
  skillLabel: string;         // "Skill"
  skillPluralLabel: string;   // "Skills"
  xpLabel: string;            // "XP"
  xpFullLabel: string;        // "Experience Points"
  incidentLabel: string;      // "Incident"
  incidentPluralLabel: string;// "Incidents"
  sessionLabel: string;       // "Session"
  sessionPluralLabel: string; // "Sessions"
  actionLabel: string;        // "Action"
  rollLabel: string;          // "Roll"

  // Status / UI flavor
  activeStatusLabel: string;  // "On Shift"
  inactiveStatusLabel: string;// "Off Shift"
  joinLabel: string;          // "Clock In"
  leaveLabel: string;         // "Clock Out"
  commendationLabel: string;  // "Commendation"
  commendationPluralLabel: string; // "Commendations"

  // Default job title placeholder
  defaultJobTitle: string;    // "Security Analyst"

  // AI GM persona name/flavor
  aiGmName: string;           // "ARIA"
  aiGmDescription: string;    // "Automated Response & Incident AI"

  // Color accent (CSS hex or oklch)
  accentColor: string;        // "#14b8a6" (teal)
  accentColorDark: string;    // "#0d9488"
}

// ─── Preset Themes ────────────────────────────────────────────────────────────

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  facility404: {
    gameName: "Roll for Uptime",
    tagline: "Keep the lights on. Whatever it takes.",
    settingName: "Facility 404",
    settingShortName: "F-404",
    welcomeMessage: "Welcome to Facility 404. Clock in.",
    operatorLabel: "Operator",
    operatorPluralLabel: "Operators",
    operatorFileLabel: "Operator File",
    supervisorLabel: "Shift Supervisor",
    supervisorPluralLabel: "Shift Supervisors",
    skillLabel: "Skill",
    skillPluralLabel: "Skills",
    xpLabel: "XP",
    xpFullLabel: "Experience Points",
    incidentLabel: "Incident",
    incidentPluralLabel: "Incidents",
    sessionLabel: "Session",
    sessionPluralLabel: "Sessions",
    actionLabel: "Action",
    rollLabel: "Roll",
    activeStatusLabel: "On Shift",
    inactiveStatusLabel: "Off Shift",
    joinLabel: "Clock In",
    leaveLabel: "Clock Out",
    commendationLabel: "Commendation",
    commendationPluralLabel: "Commendations",
    defaultJobTitle: "Security Analyst",
    aiGmName: "ARIA",
    aiGmDescription: "Automated Response & Incident AI",
    accentColor: "#14b8a6",
    accentColorDark: "#0d9488",
  },

  theRealm: {
    gameName: "Roll for the Realm",
    tagline: "Magic fades. Heroes rise.",
    settingName: "The Realm",
    settingShortName: "Realm",
    welcomeMessage: "Welcome, adventurer. Your quest begins.",
    operatorLabel: "Adventurer",
    operatorPluralLabel: "Adventurers",
    operatorFileLabel: "Character Sheet",
    supervisorLabel: "Game Master",
    supervisorPluralLabel: "Game Masters",
    skillLabel: "Ability",
    skillPluralLabel: "Abilities",
    xpLabel: "XP",
    xpFullLabel: "Experience Points",
    incidentLabel: "Quest",
    incidentPluralLabel: "Quests",
    sessionLabel: "Adventure",
    sessionPluralLabel: "Adventures",
    actionLabel: "Action",
    rollLabel: "Roll",
    activeStatusLabel: "In the Field",
    inactiveStatusLabel: "At the Inn",
    joinLabel: "Join the Party",
    leaveLabel: "Return to Town",
    commendationLabel: "Honor",
    commendationPluralLabel: "Honors",
    defaultJobTitle: "Wandering Adventurer",
    aiGmName: "The Oracle",
    aiGmDescription: "Ancient voice of fate and story",
    accentColor: "#a855f7",
    accentColorDark: "#9333ea",
  },

  dustyTrails: {
    gameName: "Roll for Dusty Trails",
    tagline: "The frontier doesn't forgive.",
    settingName: "The Frontier",
    settingShortName: "Frontier",
    welcomeMessage: "Welcome to the frontier, stranger. Saddle up.",
    operatorLabel: "Gunslinger",
    operatorPluralLabel: "Gunslingers",
    operatorFileLabel: "Wanted Poster",
    supervisorLabel: "Marshal",
    supervisorPluralLabel: "Marshals",
    skillLabel: "Trade",
    skillPluralLabel: "Trades",
    xpLabel: "Rep",
    xpFullLabel: "Reputation",
    incidentLabel: "Job",
    incidentPluralLabel: "Jobs",
    sessionLabel: "Ride",
    sessionPluralLabel: "Rides",
    actionLabel: "Move",
    rollLabel: "Draw",
    activeStatusLabel: "On the Trail",
    inactiveStatusLabel: "In Town",
    joinLabel: "Ride Out",
    leaveLabel: "Head Back",
    commendationLabel: "Badge",
    commendationPluralLabel: "Badges",
    defaultJobTitle: "Drifter",
    aiGmName: "The Narrator",
    aiGmDescription: "Voice of the frontier",
    accentColor: "#d97706",
    accentColorDark: "#b45309",
  },

  blank: {
    gameName: "Roll for It",
    tagline: "Your story. Your rules.",
    settingName: "The Setting",
    settingShortName: "Setting",
    welcomeMessage: "Welcome. Your adventure begins here.",
    operatorLabel: "Character",
    operatorPluralLabel: "Characters",
    operatorFileLabel: "Character File",
    supervisorLabel: "Game Master",
    supervisorPluralLabel: "Game Masters",
    skillLabel: "Skill",
    skillPluralLabel: "Skills",
    xpLabel: "XP",
    xpFullLabel: "Experience Points",
    incidentLabel: "Event",
    incidentPluralLabel: "Events",
    sessionLabel: "Session",
    sessionPluralLabel: "Sessions",
    actionLabel: "Action",
    rollLabel: "Roll",
    activeStatusLabel: "Active",
    inactiveStatusLabel: "Inactive",
    joinLabel: "Join",
    leaveLabel: "Leave",
    commendationLabel: "Award",
    commendationPluralLabel: "Awards",
    defaultJobTitle: "Adventurer",
    aiGmName: "The GM",
    aiGmDescription: "Your game master",
    accentColor: "#6366f1",
    accentColorDark: "#4f46e5",
  },
};

export const DEFAULT_THEME: ThemeConfig = THEME_PRESETS.blank;

// ─── Runtime theme state ──────────────────────────────────────────────────────
let _activeTheme: ThemeConfig = { ...DEFAULT_THEME };

export function getTheme(): ThemeConfig {
  return _activeTheme;
}

export function setTheme(theme: Partial<ThemeConfig>): void {
  _activeTheme = { ..._activeTheme, ...theme };
}

export function applyPreset(presetKey: string): ThemeConfig {
  const preset = THEME_PRESETS[presetKey];
  if (!preset) throw new Error(`Unknown preset: ${presetKey}`);
  _activeTheme = { ...preset };
  return _activeTheme;
}
