/**
 * GuidelineRecordMapper - Maps infrastructure GuidelineRecord to application GuidelineView.
 *
 * Handles JSON.parse for array fields, integer-to-boolean coercion,
 * and type casting at the infrastructure-application boundary.
 */

import { GuidelineView } from "../../../application/context/guidelines/GuidelineView.js";
import { GuidelineCategoryValue } from "../../../domain/guidelines/Constants.js";
import { GuidelineRecord } from "./GuidelineRecord.js";

export class GuidelineRecordMapper {
  toView(record: GuidelineRecord): GuidelineView {
    return {
      guidelineId: record.id,
      category: record.category as GuidelineCategoryValue,
      title: record.title,
      description: record.description,
      rationale: record.rationale,
      examples: JSON.parse(record.examples || "[]"),
      isRemoved: Boolean(record.isRemoved),
      removedAt: record.removedAt,
      removalReason: record.removalReason,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
