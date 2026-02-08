import { Settings } from "./Settings.js";

/**
 * Port interface for reading application settings.
 * Used by application services to access configuration.
 */
export interface ISettingsReader {
  /**
   * Read settings from the configuration file.
   * Creates file with defaults if it doesn't exist.
   * @returns Promise<Settings> - The application settings
   * @throws Error if file exists but contains invalid JSON
   */
  read(): Promise<Settings>;
}
