/**
 * InvariantRecordMapper - Maps infrastructure InvariantRecord to application InvariantView.
 *
 * Handles type casting at the infrastructure-application boundary.
 */

import { InvariantView } from "../../../application/context/invariants/InvariantView.js";
import { InvariantRecord } from "./InvariantRecord.js";

export class InvariantRecordMapper {
  toView(record: InvariantRecord): InvariantView {
    return {
      invariantId: record.id,
      title: record.title,
      description: record.description,
      rationale: record.rationale,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
