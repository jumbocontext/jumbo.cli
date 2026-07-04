import React from "react";
import { Box, Text } from "ink";
import { SemanticColors, TuiGlyphs } from "../../../shared/DesignTokens.js";
import type {
  ComponentEntityRow,
  DecisionEntityRow,
  DependencyEntityRow,
  GuidelineEntityRow,
  InvariantEntityRow,
  MemoryEntityRow,
  MemoryEntityType,
} from "./MemoryEntityShapes.js";

const DETAIL_LABEL_WIDTH = 15;
const ENTITY_DETAIL_VIEW_COPY = {
  headlinePrefixes: {
    decision: "DECISION:",
    invariant: "INVARIANT:",
    component: "COMPONENT:",
    dependency: "DEPENDENCY:",
    guideline: "GUIDELINE:",
  },
  detailsHeading: "DETAILS:",
  emptyFieldValue: "None",
  labels: {
    id: "Id",
    context: "Context",
    rationale: "Rationale",
    alternatives: "Alternatives",
    consequences: "Consequences",
    description: "Description",
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
  readonly entity: MemoryEntityRow;
  readonly heading: string;
}

interface DetailEntry {
  readonly label: string;
  readonly value: string;
}

export function EntityDetailView({
  entityType,
  entity,
  heading,
}: EntityDetailViewProps): React.ReactElement {
  const entries = buildEntries(entityType, entity);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={SemanticColors.headline}>
          {ENTITY_DETAIL_VIEW_COPY.headlinePrefixes[entityType]}{" "}
        </Text>
        <Text color={SemanticColors.headline}>{heading}</Text>
      </Box>

      <Box marginTop={1}>
        <Text color={SemanticColors.h2} bold>
          {ENTITY_DETAIL_VIEW_COPY.detailsHeading}
        </Text>
      </Box>

      <Box flexDirection="column">
        {entries.map((entry, entryIndex) => (
          <Box key={entry.label} marginTop={entryIndex > 0 ? 1 : 0}>
            <Box flexShrink={0}>
              <Text color={SemanticColors.label}>{padLabel(entry.label)} </Text>
            </Box>
            <Text color={SemanticColors.primary}>
              {entry.value.length === 0
                ? ENTITY_DETAIL_VIEW_COPY.emptyFieldValue
                : entry.value}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function padLabel(label: string): string {
  return label.padEnd(DETAIL_LABEL_WIDTH, TuiGlyphs.dot);
}

function buildEntries(
  entityType: MemoryEntityType,
  entity: MemoryEntityRow,
): readonly DetailEntry[] {
  switch (entityType) {
    case "decision": {
      const decision = entity as DecisionEntityRow;
      return [
        { label: ENTITY_DETAIL_VIEW_COPY.labels.id, value: decision.id },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.context, value: decision.context },
        { label: ENTITY_DETAIL_VIEW_COPY.labels.rationale, value: decision.rationale },
        {
          label: ENTITY_DETAIL_VIEW_COPY.labels.alternatives,
          value: decision.alternatives.join(` ${TuiGlyphs.bullet} `),
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
          value: guideline.examples.join(` ${TuiGlyphs.bullet} `),
        },
      ];
    }
  }
}
