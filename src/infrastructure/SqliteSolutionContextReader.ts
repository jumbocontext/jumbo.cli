/**
 * SqliteSolutionContextReader - Aggregates solution context from multiple readers
 *
 * Composes existing solution context readers to build the aggregated view.
 * This avoids duplicating SQL queries and row mapping logic.
 */

import { Database } from "better-sqlite3";
import { ISolutionContextReader } from "../application/ISolutionContextReader.js";
import { SolutionContextView } from "../application/SolutionContextView.js";
import { ArchitectureView } from "../application/context/architecture/ArchitectureView.js";
import { ComponentView } from "../application/context/components/ComponentView.js";
import { DecisionView } from "../application/context/decisions/DecisionView.js";
import { InvariantView } from "../application/context/invariants/InvariantView.js";
import { GuidelineView } from "../application/context/guidelines/GuidelineView.js";
import { ComponentTypeValue, ComponentStatusValue } from "../domain/components/Constants.js";
import { GuidelineCategoryValue } from "../domain/guidelines/Constants.js";

export class SqliteSolutionContextReader implements ISolutionContextReader {
  constructor(private readonly db: Database) {}

  async getSolutionContext(): Promise<SolutionContextView> {
    const [architecture, components, decisions, invariants, guidelines] =
      await Promise.all([
        this.getArchitecture(),
        this.getActiveComponents(),
        this.getActiveDecisions(),
        this.getInvariants(),
        this.getActiveGuidelines(),
      ]);

    return {
      architecture,
      components,
      decisions,
      invariants,
      guidelines,
    };
  }

  private async getArchitecture(): Promise<ArchitectureView | null> {
    const row = this.db
      .prepare("SELECT * FROM architecture_views WHERE architectureId = ?")
      .get("architecture");

    if (!row) {
      return null;
    }

    const r = row as Record<string, unknown>;
    return {
      architectureId: r.architectureId as string,
      description: r.description as string,
      organization: r.organization as string,
      patterns: JSON.parse((r.patterns as string) || "[]"),
      principles: JSON.parse((r.principles as string) || "[]"),
      dataStores: JSON.parse((r.dataStores as string) || "[]"),
      stack: JSON.parse((r.stack as string) || "[]"),
      version: r.version as number,
      createdAt: r.createdAt as string,
      updatedAt: r.updatedAt as string,
    };
  }

  private async getActiveComponents(): Promise<ComponentView[]> {
    const rows = this.db
      .prepare("SELECT * FROM component_views WHERE status = 'active' ORDER BY name")
      .all();

    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        componentId: r.componentId as string,
        name: r.name as string,
        type: r.type as ComponentTypeValue,
        description: r.description as string,
        responsibility: r.responsibility as string,
        path: r.path as string,
        status: r.status as ComponentStatusValue,
        deprecationReason: (r.deprecationReason as string) ?? null,
        version: r.version as number,
        createdAt: r.createdAt as string,
        updatedAt: r.updatedAt as string,
      };
    });
  }

  private async getActiveDecisions(): Promise<DecisionView[]> {
    const rows = this.db
      .prepare("SELECT * FROM decision_views WHERE status = 'active' ORDER BY createdAt DESC")
      .all();

    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        decisionId: r.decisionId as string,
        title: r.title as string,
        context: r.context as string,
        rationale: (r.rationale as string) ?? null,
        alternatives: JSON.parse((r.alternatives as string) || "[]"),
        consequences: (r.consequences as string) ?? null,
        status: r.status as DecisionView["status"],
        supersededBy: (r.supersededBy as string) ?? null,
        reversalReason: (r.reversalReason as string) ?? null,
        reversedAt: (r.reversedAt as string) ?? null,
        version: r.version as number,
        createdAt: r.createdAt as string,
        updatedAt: r.updatedAt as string,
      };
    });
  }

  private async getInvariants(): Promise<InvariantView[]> {
    const rows = this.db
      .prepare("SELECT * FROM invariant_views ORDER BY createdAt ASC")
      .all();

    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        invariantId: r.invariantId as string,
        title: r.title as string,
        description: r.description as string,
        rationale: (r.rationale as string) ?? null,
        enforcement: r.enforcement as string,
        version: r.version as number,
        createdAt: r.createdAt as string,
        updatedAt: r.updatedAt as string,
      };
    });
  }

  private async getActiveGuidelines(): Promise<GuidelineView[]> {
    const rows = this.db
      .prepare("SELECT * FROM guideline_views WHERE isRemoved = 0 ORDER BY createdAt DESC")
      .all();

    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        guidelineId: r.guidelineId as string,
        category: r.category as GuidelineCategoryValue,
        title: r.title as string,
        description: r.description as string,
        rationale: r.rationale as string,
        enforcement: r.enforcement as string,
        examples: JSON.parse((r.examples as string) || "[]"),
        isRemoved: (r.isRemoved as number) === 1,
        removedAt: (r.removedAt as string) ?? null,
        removalReason: (r.removalReason as string) ?? null,
        version: r.version as number,
        createdAt: r.createdAt as string,
        updatedAt: r.updatedAt as string,
      };
    });
  }
}
