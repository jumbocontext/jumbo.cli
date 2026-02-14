import { InvariantView } from "../InvariantView.js";
import { UUID } from "../../../../domain/BaseEvent.js";

/**
 * Port interface for reading invariant projections.
 * Used by UpdateInvariantCommandHandler to fetch updated view.
 */
export interface IInvariantUpdateReader {
  findById(invariantId: UUID): Promise<InvariantView | null>;
}
