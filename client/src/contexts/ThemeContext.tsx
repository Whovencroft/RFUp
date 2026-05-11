import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "../lib/trpc";

// Mirror of server ThemeConfig — keep in sync with server/theme.ts
export interface ThemeConfig {
  gameName: string;
  tagline: string;
  settingName: string;
  settingShortName: string;
  welcomeMessage: string;
  operatorLabel: string;
  operatorPluralLabel: string;
  operatorFileLabel: string;
  supervisorLabel: string;
  supervisorPluralLabel: string;
  skillLabel: string;
  skillPluralLabel: string;
  xpLabel: string;
  xpFullLabel: string;
  incidentLabel: string;
  incidentPluralLabel: string;
  sessionLabel: string;
  sessionPluralLabel: string;
  actionLabel: string;
  rollLabel: string;
  activeStatusLabel: string;
  inactiveStatusLabel: string;
  joinLabel: string;
  leaveLabel: string;
  commendationLabel: string;
  commendationPluralLabel: string;
  defaultJobTitle: string;
  aiGmName: string;
  aiGmDescription: string;
  accentColor: string;
  accentColorDark: string;
}

const DEFAULT_THEME: ThemeConfig = {
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
};

interface ThemeContextValue {
  theme: ThemeConfig;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  isLoading: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = trpc.theme.getTheme.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const theme = data ?? DEFAULT_THEME;

  // Apply accent color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", theme.accentColor);
    document.documentElement.style.setProperty("--accent-color-dark", theme.accentColorDark);
    document.title = theme.gameName;
  }, [theme.accentColor, theme.accentColorDark, theme.gameName]);

  return (
    <ThemeContext.Provider value={{ theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeConfig {
  return useContext(ThemeContext).theme;
}
