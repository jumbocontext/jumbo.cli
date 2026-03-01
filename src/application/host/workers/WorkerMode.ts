/**
 * WorkerMode - Represents the current operating mode of a worker.
 *
 * Workers can operate in different modes during their lifecycle:
 * - plan: Worker is planning implementation approach
 * - implement: Worker is implementing code changes
 * - review: Worker is reviewing completed work
 * - codify: Worker is codifying decisions and patterns
 * - null: No specific mode set (default)
 */
export type WorkerMode = "plan" | "implement" | "review" | "codify" | null;
