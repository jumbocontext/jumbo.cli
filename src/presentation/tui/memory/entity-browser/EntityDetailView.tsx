import React from "react";
import { DetailPane } from "../../ui-primitives/DetailPane.js";
import type {
  ComponentEntityRow,
  DecisionEntityRow,
  DependencyEntityRow,
  GuidelineEntityRow,
  InvariantEntityRow,
  MemoryEntityType,
} from "./MemoryEntityShapes.js";

const LIST_SEPARATOR = "\n";

interface EntityDetailViewProps {
  readonly entityType: MemoryEntityType;
  readonly entity:
    | DecisionEntityRow
    | InvariantEntityRow
    | ComponentEntityRow
    | DependencyEntityRow
    | GuidelineEntityRow;
  readonly width?: number;
}

interface DetailEntry {
  readonly label: string;
  readonly value: string;
}

export function EntityDetailView({
  entityType,
  entity,
  width,
}: EntityDetailViewProps): React.ReactElement {
  const entries = buildEntries(entityType, entity);
  return (
    <DetailPane
      title={detailTitle(entityType)}
      entries={entries.map((entry) => ({
        label: entry.label,
        value: entry.value,
      }))}
      width={width}
    />
  );
}

function detailTitle(entityType: MemoryEntityType): string {
  switch (entityType) {
    case "decision":
      return "Decision Detail";
    case "invariant":
      return "Invariant Detail";
    case "component":
      return "Component Detail";
    case "dependency":
      return "Dependency Detail";
    case "guideline":
      return "Guideline Detail";
  }
}

function buildEntries(
  entityType: MemoryEntityType,
  entity:
    | DecisionEntityRow
    | InvariantEntityRow
    | ComponentEntityRow
    | DependencyEntityRow
    | GuidelineEntityRow,
): readonly DetailEntry[] {
  switch (entityType) {
    case "decision": {
      const decision = entity as DecisionEntityRow;
      return [
        { label: "ID", value: decision.id },
        { label: "Title", value: decision.title },
        { label: "Context", value: decision.context },
        { label: "Rationale", value: decision.rationale },
        {
          label: "Alternatives",
          value: decision.alternatives.join(LIST_SEPARATOR),
        },
        { label: "Consequences", value: decision.consequences },
      ];
    }
    case "invariant": {
      const invariant = entity as InvariantEntityRow;
      return [
        { label: "ID", value: invariant.id },
        { label: "Title", value: invariant.title },
        { label: "Description", value: invariant.description },
        { label: "Rationale", value: invariant.rationale },
      ];
    }
    case "component": {
      const component = entity as ComponentEntityRow;
      return [
        { label: "ID", value: component.id },
        { label: "Name", value: component.name },
        { label: "Type", value: component.type },
        { label: "Description", value: component.description },
        { label: "Responsibility", value: component.responsibility },
      ];
    }
    case "dependency": {
      const dependency = entity as DependencyEntityRow;
      return [
        { label: "ID", value: dependency.id },
        { label: "Name", value: dependency.name },
        { label: "Ecosystem", value: dependency.ecosystem },
        { label: "Package", value: dependency.packageName },
        { label: "Version", value: dependency.versionConstraint },
        { label: "Endpoint", value: dependency.endpoint },
        { label: "Contract", value: dependency.contract },
      ];
    }
    case "guideline": {
      const guideline = entity as GuidelineEntityRow;
      return [
        { label: "ID", value: guideline.id },
        { label: "Title", value: guideline.title },
        { label: "Category", value: guideline.category },
        { label: "Description", value: guideline.description },
        { label: "Rationale", value: guideline.rationale },
        { label: "Examples", value: guideline.examples.join(LIST_SEPARATOR) },
      ];
    }
  }
}
