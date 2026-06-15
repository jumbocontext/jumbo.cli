/**
 * Injectable wall-clock source. Factories accept a Clock so timestamp
 * generation is deterministic under test instead of reaching for `new Date()`
 * inline. Production code uses `systemClock`.
 */
export type Clock = () => string;

/** ISO-8601 UTC timestamp from the system clock. */
export const systemClock: Clock = () => new Date().toISOString();
