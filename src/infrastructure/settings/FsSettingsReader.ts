import fs from "fs-extra";
import path from "path";
import * as jsonc from "jsonc-parser";
import { ISettingsReader } from "../../application/settings/ISettingsReader.js";
import { Settings } from "../../application/settings/Settings.js";
import { DEFAULT_SETTINGS } from "./DefaultSettings.js";

/**
 * JsoncSettingsReader - File system implementation for reading settings.
 *
 * Reads settings from .jumbo/settings.jsonc file.
 * Creates the file with defaults if it doesn't exist.
 * Supports JSONC format (JSON with comments).
 */
export class FsSettingsReader implements ISettingsReader {
  private readonly settingsFilePath: string;

  constructor(rootDir: string) {
    this.settingsFilePath = path.join(rootDir, "settings.jsonc");
  }

  async read(): Promise<Settings> {
    // Check if settings file exists
    if (!(await fs.pathExists(this.settingsFilePath))) {
      // Create file with defaults
      await this.createDefaultSettingsFile();
      return DEFAULT_SETTINGS;
    }

    // Read and parse existing file
    try {
      const content = await fs.readFile(this.settingsFilePath, "utf-8");
      const errors: jsonc.ParseError[] = [];
      const settings = jsonc.parse(content, errors, {
        allowTrailingComma: true,
      }) as Settings;

      if (errors.length > 0) {
        throw new Error(
          `Invalid JSON in settings file: ${this.formatParseErrors(errors)}`
        );
      }

      // Merge with defaults to handle missing fields
      return this.mergeWithDefaults(settings);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to read settings file at ${this.settingsFilePath}: ${error.message}`
        );
      }
      throw error;
    }
  }

  async write(settings: Settings): Promise<void> {
    const normalizedSettings = this.mergeWithDefaults(settings);
    const content = this.buildSettingsFileContent(normalizedSettings);
    await fs.writeFile(this.settingsFilePath, content, "utf-8");
  }

  async hasTelemetryConfiguration(): Promise<boolean> {
    if (!(await fs.pathExists(this.settingsFilePath))) {
      return false;
    }

    const parsed = await this.readRawSettings();
    const telemetry = parsed.telemetry;

    if (!telemetry || typeof telemetry !== "object") {
      return false;
    }

    return Object.prototype.hasOwnProperty.call(telemetry, "enabled")
      || Object.prototype.hasOwnProperty.call(telemetry, "anonymousId");
  }

  /**
   * Create settings file with default values and helpful comments
   */
  private async createDefaultSettingsFile(): Promise<void> {
    await this.write(DEFAULT_SETTINGS);
  }

  /**
   * Merge parsed settings with defaults to handle missing fields
   */
  private mergeWithDefaults(settings: Partial<Settings>): Settings {
    return {
      qa: {
        defaultTurnLimit:
          settings.qa?.defaultTurnLimit ?? DEFAULT_SETTINGS.qa.defaultTurnLimit,
      },
      claims: {
        claimDurationMinutes:
          settings.claims?.claimDurationMinutes ??
          DEFAULT_SETTINGS.claims.claimDurationMinutes,
      },
      telemetry: {
        enabled:
          settings.telemetry?.enabled ?? DEFAULT_SETTINGS.telemetry.enabled,
        anonymousId:
          settings.telemetry?.anonymousId ?? DEFAULT_SETTINGS.telemetry.anonymousId,
      },
    };
  }

  private buildSettingsFileContent(settings: Settings): string {
    const anonymousIdValue = settings.telemetry.anonymousId === null
      ? "null"
      : `"${settings.telemetry.anonymousId}"`;

    return `{
  // Quality Assurance settings for goal completion
  "qa": {
    // Default turn limit for QA iterations on goal completion
    // When this limit is reached, the goal is automatically completed
    "defaultTurnLimit": ${settings.qa.defaultTurnLimit}
  },

  // Claim settings for goal ownership and concurrency control
  "claims": {
    // Duration in minutes that a goal claim remains valid
    // After this duration, the claim expires and another worker can claim the goal
    "claimDurationMinutes": ${settings.claims.claimDurationMinutes}
  },

  // Telemetry consent and anonymous identity settings
  "telemetry": {
    // Whether anonymous usage telemetry is enabled
    "enabled": ${settings.telemetry.enabled},
    // Anonymous identifier used after telemetry opt-in
    "anonymousId": ${anonymousIdValue}
  }
}
`;
  }

  private async readRawSettings(): Promise<Partial<Settings>> {
    const content = await fs.readFile(this.settingsFilePath, "utf-8");
    const errors: jsonc.ParseError[] = [];
    const settings = jsonc.parse(content, errors, {
      allowTrailingComma: true,
    }) as Partial<Settings>;

    if (errors.length > 0) {
      throw new Error(
        `Invalid JSON in settings file: ${this.formatParseErrors(errors)}`
      );
    }

    return settings;
  }

  /**
   * Format parse errors into a readable message
   */
  private formatParseErrors(errors: jsonc.ParseError[]): string {
    return errors
      .map(
        (err) =>
          `Error at offset ${err.offset}: ${jsonc.printParseErrorCode(err.error)}`
      )
      .join(", ");
  }
}
