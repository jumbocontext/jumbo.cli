/**
 * Tiny shared validation helpers for domain factories, so required-field guards
 * read uniformly and the messages stay consistent across result types.
 */

/** Throws with `message` when `value` is missing/empty/falsy. */
export function requireField(value: unknown, message: string): void {
  if (!value) throw new Error(message);
}
