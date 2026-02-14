import { InvariantView } from "../InvariantView.js";
import { UUID } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading invariant data needed during remove operations.
 * Used by RemoveInvariantCommandHandler to check if invariant exists.
 */
export interface IInvariantRemoveReader {
  findById(id: UUID): Promise<InvariantView | null>;
}
