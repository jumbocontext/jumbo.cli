/**
 * ResumeWorkRequest - Input for resuming work.
 *
 * Currently empty as work resume requires no parameters.
 * The worker's paused goal is identified automatically.
 * Exists to follow the controller Request/Response convention.
 */
export type ResumeWorkRequest = Record<string, never>;
