/**
 * Settings type definitions for application-wide configuration.
 * Settings are stored in .jumbo/settings.jsonc file.
 */

export interface QASettings {
  /**
   * Default turn limit for QA iterations on goal completion.
   * When this limit is reached, the goal is automatically completed.
   * Default: 3
   */
  defaultTurnLimit: number;
}

/**
 * Default claim duration in milliseconds (30 minutes).
 * Used as the fallback when no custom duration is configured.
 */
export const DEFAULT_CLAIM_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Default claim duration in minutes.
 * Used in settings file for user-friendly configuration.
 */
export const DEFAULT_CLAIM_DURATION_MINUTES = 30;

export interface ClaimSettings {
  /**
   * Duration in minutes that a goal claim remains valid.
   * After this duration, the claim expires and another worker can claim the goal.
   * Default: 30 minutes
   */
  claimDurationMinutes: number;
}

export interface Settings {
  /**
   * QA (Quality Assurance) settings for goal completion
   */
  qa: QASettings;

  /**
   * Claim settings for goal ownership and concurrency control
   */
  claims: ClaimSettings;
}
