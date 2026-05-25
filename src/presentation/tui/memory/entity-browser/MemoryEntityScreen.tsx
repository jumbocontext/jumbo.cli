import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { SemanticColors } from "../../../shared/DesignTokens.js";
import { KeyBadge } from "../../ui-primitives/KeyBadge.js";
import { Panel } from "../../ui-primitives/Panel.js";
import { EntityColumn } from "./EntityColumn.js";
import { EntityDetailView } from "./EntityDetailView.js";
import type {
  ComponentEntityRow,
  DecisionEntityRow,
  DependencyEntityRow,
  GuidelineEntityRow,
  InvariantEntityRow,
  MemoryEntityRow,
  MemoryEntityType,
} from "./MemoryEntityShapes.js";

const LIST_WIDTH = 46;
const DETAIL_WIDTH = 78;
const MEMORY_REPLAY_EVENTS = [
  "Loaded entity read model",
  "Selected entity row",
  "Rendered projected detail view",
] as const;

interface MemoryEntityScreenProps {
  readonly entityType: MemoryEntityType;
  readonly title: string;
  readonly subtitle: string;
  readonly rows: readonly MemoryEntityRow[];
  readonly loading?: boolean;
  readonly error?: Error | null;
}

export function MemoryEntityScreen({
  entityType,
  title,
  subtitle,
  rows,
  loading = false,
  error = null,
}: MemoryEntityScreenProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const selectedEntity = rows[selectedIndex];

  useInput((input, key) => {
    if (key.downArrow && selectedIndex < rows.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      return;
    }

    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      return;
    }

    if (input === "]") {
      setEventIndex((eventIndex + 1) % MEMORY_REPLAY_EVENTS.length);
      return;
    }

    if (input === "[") {
      const nextEventIndex =
        eventIndex === 0 ? MEMORY_REPLAY_EVENTS.length - 1 : eventIndex - 1;
      setEventIndex(nextEventIndex);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1} gap={1}>
      <Box flexDirection="column">
        <Text color={SemanticColors.headline} bold>
          {title}
        </Text>
        <Text color={SemanticColors.secondary}>{subtitle}</Text>
      </Box>

      <Box gap={2}>
        <EntityColumn
          title={`${title} List`}
          entries={
            loading && rows.length === 0
              ? [{ id: "loading", label: `Loading ${title.toLowerCase()}` }]
              : rows.map((row) => ({
                  id: row.id,
                  label: labelForRow(entityType, row),
                }))
          }
          selectedId={selectedEntity?.id}
          isActive={true}
          width={LIST_WIDTH}
        />

        {error !== null && (
          <Panel title="Read Error" width={DETAIL_WIDTH}>
            <Text color={SemanticColors.error}>{error.message}</Text>
          </Panel>
        )}

        {error === null && selectedEntity && (
          <EntityDetailView
            entityType={entityType}
            entity={selectedEntity}
            width={DETAIL_WIDTH}
          />
        )}
      </Box>

      <Panel title="Event Replay">
        <Box flexDirection="column">
          <Text color={SemanticColors.primary}>
            Current state: event {eventIndex + 1} of{" "}
            {MEMORY_REPLAY_EVENTS.length}
          </Text>
          <Text color={SemanticColors.secondary}>
            {MEMORY_REPLAY_EVENTS[eventIndex]}
          </Text>
        </Box>
      </Panel>

      <Panel title="Action Hints">
        <Box gap={2}>
          <KeyBadge char="↑↓" label="select" />
          <KeyBadge char="[" label="previous event" />
          <KeyBadge char="]" label="next event" />
        </Box>
      </Panel>
    </Box>
  );
}

function labelForRow(entityType: MemoryEntityType, row: MemoryEntityRow): string {
  switch (entityType) {
    case "decision":
      return (row as DecisionEntityRow).title;
    case "invariant":
      return (row as InvariantEntityRow).title;
    case "component":
      return (row as ComponentEntityRow).name;
    case "dependency":
      return (row as DependencyEntityRow).name;
    case "guideline":
      return (row as GuidelineEntityRow).title;
  }
}
