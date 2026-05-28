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
const ENTITY_DETAIL_VIEW_COPY = {
  titles: {
    decision: "Decision Detail",
    invariant: "Invariant Detail",
    component: "Component Detail",
    dependency: "Dependency Detail",
    guideline: "Guideline Detail",
  },
  labels: {
    id: "ID",
    title: "Title",
    context: "Context",
    rationale: "Rationale",
    alternatives: "Alternatives",
    consequences: "Consequences",
    description: "Description",
    name: "Name",
    type: "Type",
    responsibility: "Responsibility",
    ecosystem: "Ecosystem",
    packageName: "Package",
    versionConstraint: "Version",
    endpoint: "Endpoint",
    contract: "Contract",
    category: "Category",
    examples: "Examples",
  },
} as const;

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
  return ENTITY_DETAIL_VIEW_COPY.titles[entityType];
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
        { label: ENTITY_DETAIL_VIEW_COPY.labels.id, value: decision.id },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.title, value: decision.title },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.context, value: decision.context },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.rationale, value: decision.rationale },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.alternatives,
          value: decision.alternatives.join(LIST_SEPARATOR),
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.consequences,
          value: decision.consequences,
        },
      ];
    }
    case "invariant": {
      const invariant = entity as InvariantEntityRow;
      return [
        { label: ENTITY_DETAIL_VIEW_COPY.labels.id, value: invariant.id },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.title, value: invariant.title },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.description,
          value: invariant.description,
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.rationale,
          value: invariant.rationale,
        },
      ];
    }
    case "component": {
      const component = entity as ComponentEntityRow;
      return [
        { label: ENTITY_DETAIL_VIEW_COPY.labels.id, value: component.id },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.name, value: component.name },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.type, value: component.type },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.description,
          value: component.description,
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.responsibility,
          value: component.responsibility,
        },
      ];
    }
    case "dependency": {
      const dependency = entity as DependencyEntityRow;
      return [
        { label: ENTITY_DETAIL_VIEW_COPY.labels.id, value: dependency.id },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.name, value: dependency.name },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.ecosystem,
          value: dependency.ecosystem,
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.packageName,
          value: dependency.packageName,
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.versionConstraint,
          value: dependency.versionConstraint,
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.endpoint,
          value: dependency.endpoint,
        },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.contract, value: dependency.contract },
      ];
    }
    case "guideline": {
      const guideline = entity as GuidelineEntityRow;
      return [
        { label: ENTITY_DETAIL_VIEW_COPY.labels.id, value: guideline.id },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.title, value: guideline.title },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.category,
          value: guideline.category,
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.description,
          value: guideline.description,
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.rationale,
          value: guideline.rationale,
        },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.examples,
          value: guideline.examples.join(LIST_SEPARATOR),
        },
      ];
    }
  }
}
