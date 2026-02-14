import fs from "fs-extra";
import path from "path";
import { ISettingsInitializer } from "../../application/settings/ISettingsInitializer.js";
import { PlannedFileChange } from "../../application/context/project/init/PlannedFileChange.js";

/**
 * FsSettingsInitializer - Creates settings file with defaults if it doesn't exist.
 *
 * Called during bootstrap to ensure settings infrastructure is ready.
 * Only creates the file if missing - doesn't overwrite existing settings.
 */
export class FsSettingsInitializer implements ISettingsInitializer {
  private readonly settingsFilePath: string;

  constructor(rootDir: string) {
    this.settingsFilePath = path.join(rootDir, "settings.jsonc");
  }

  async ensureSettingsFileExists(): Promise<void> {
    // Only create if it doesn't exist
    if (await fs.pathExists(this.settingsFilePath)) {
      return;
    }

    const content = `{
  // Quality Assurance settings for goal completion
  "qa": {
    // Default turn limit for QA iterations on goal completion
    // When this limit is reached, the goal is automatically completed
    "defaultTurnLimit": 3
  }
}
`;

    await fs.writeFile(this.settingsFilePath, content, "utf-8");
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
