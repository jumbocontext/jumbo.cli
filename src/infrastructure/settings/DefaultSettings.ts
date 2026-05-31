import {
  Settings,
  DEFAULT_CLAIM_DURATION_MINUTES,
  DEFAULT_BACKLOG_PREVIEW_SIZE,
} from "../../application/settings/Settings.js";

/**
 * Default settings used when no settings file exists
 * or when creating a new settings file.
 */
export const DEFAULT_SETTINGS: Settings = {
  qa: {
    defaultTurnLimit: 3,
  },
  claims: {
    claimDurationMinutes: DEFAULT_CLAIM_DURATION_MINUTES,
  },
  telemetry: {
    enabled: true,
    anonymousId: null,
    consentGiven: false,
  },
  tui: {
    showLaunchpadWelcome: true,
  },
  session: {
    backlogPreviewSize: DEFAULT_BACKLOG_PREVIEW_SIZE,
  },
};
