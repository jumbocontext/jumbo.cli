import fs from "fs-extra";
import path from "path";
import { ISettingsInitializer } from "../../application/settings/ISettingsInitializer.js";
import { PlannedFileChange } from "../../application/context/project/init/PlannedFileChange.js";
import { DEFAULT_SETTINGS } from "./DefaultSettings.js";
import { JsonObject, applyMissingDefaults, assertValidJsonc } from "./JsoncSettingsEditor.js";

/**
 * FsSettingsInitializer - Creates settings file with defaults if it doesn't exist,
 * and additively fills in any missing default sections or fields if it does.
 *
 * Called during bootstrap and evolve to ensure settings infrastructure is current.
 * Existing explicit values and unknown entries are always preserved.
 */
export class FsSettingsInitializer implements ISettingsInitializer {
  private readonly settingsFilePath: string;

  constructor(rootDir: string) {
    this.settingsFilePath = path.join(rootDir, "settings.jsonc");
  }

  async ensureSettingsFileExists(): Promise<void> {
    if (await fs.pathExists(this.settingsFilePath)) {
      await this.applyMissingDefaults();
      return;
    }

    const content = `{
  // Stable project identity
  "project": {
    // Generated at project initialization and reused for project event streams
    "id": null
  },

  // Quality Assurance settings for goal completion
  "qa": {
    // Default turn limit for QA iterations on goal completion
    // When this limit is reached, the goal is automatically completed
    "defaultTurnLimit": 3
  },

  // Claim settings for goal ownership and concurrency control
  "claims": {
    // Duration in minutes that a goal claim remains valid
    // After this duration, the claim expires and another worker can claim the goal
    "claimDurationMinutes": 30
  },

  // Telemetry consent and anonymous identity settings
  "telemetry": {
    // Whether anonymous usage telemetry is enabled (opt-out model)
    "enabled": true,
    // Anonymous identifier used for telemetry events after consent
    "anonymousId": null,
    // Whether the user has explicitly made a telemetry consent decision
    "consentGiven": false
  },

  // TUI presentation preferences
  "tui": {
    // Whether the Cockpit launchpad welcome panel should be shown
    "showLaunchpadWelcome": true
  },

  // Session workflow preferences
  "session": {
    // Maximum number of available backlog goals to include in session start
    "backlogPreviewSize": 5
  }
}
`;

    await fs.writeFile(this.settingsFilePath, content, "utf-8");
  }

  /**
   * Fill in any missing default sections or fields on an existing settings
   * file, leaving explicit values and unknown entries untouched.
   */
  private async applyMissingDefaults(): Promise<void> {
    const content = await fs.readFile(this.settingsFilePath, "utf-8");
    assertValidJsonc(content, this.settingsFilePath);

    const updated = applyMissingDefaults(content, DEFAULT_SETTINGS as unknown as JsonObject);
    if (updated !== content) {
      await fs.writeFile(this.settingsFilePath, updated, "utf-8");
    }
  }

  async getPlannedFileChange(): Promise<PlannedFileChange | null> {
    if (await fs.pathExists(this.settingsFilePath)) {
      return null; // No change needed
    }
    return {
      path: ".jumbo/settings.jsonc",
      action: "create",
      description: "Jumbo configuration settings",
    };
  }
}
