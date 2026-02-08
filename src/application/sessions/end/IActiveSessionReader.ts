import { SessionView } from "../SessionView.js";

/**
 * Port interface for reading active session from the projection store.
 * Used by EndSessionCommandHandler to find the session to end.
 */
export interface IActiveSessionReader {
  findActive(): Promise<SessionView | null>;
}
