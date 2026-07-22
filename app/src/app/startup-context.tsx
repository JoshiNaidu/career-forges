import { createContext, useContext } from "react";

export type StartupState = {
  onboardingCompleted: boolean;
  selectedProvider: string;
  resumeUploaded: boolean;
};

export const StartupContext =
  createContext<StartupState | null>(null);

export function useStartup() {
  const ctx = useContext(StartupContext);

  if (!ctx) {
    throw new Error(
      "useStartup must be used inside StartupContext",
    );
  }

  return ctx;
}