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
const LOADING_ENTRY_ID = "loading";
const MEMORY_ENTITY_SCREEN_COPY = {
  listTitleSuffix: "List",
  loadingPrefix: "Loading",
  readErrorTitle: "Read Error",
  eventReplayTitle: "Event Replay",
  actionHintsTitle: "Action Hints",
  currentStatePrefix: "Current state",
  eventLabel: "event",
  eventReplayEvents: [
    "Loaded entity read model",
    "Selected entity row",
    "Rendered projected detail view",
  ],
  actionHints: {
    select: "select",
    previousEvent: "previous event",
    nextEvent: "next event",
  },
} as const;
const MEMORY_REPLAY_EVENTS = [
  ...MEMORY_ENTITY_SCREEN_COPY.eventReplayEvents,
] as const;

interface MemoryEntityScreenProps {
  readonly entityType: MemoryEntityType;
  readonly title: string;
  readonly subtitle: string;
  readonly rows: readonly MemoryEntityRow[];
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly shortcutsEnabled?: boolean;
}

export function MemoryEntityScreen({
  entityType,
  title,
  subtitle,
  rows,
  loading = false,
  error = null,
  shortcutsEnabled = true,
}: MemoryEntityScreenProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const selectedEntity = rows[selectedIndex];

  useInput(
    (input, key) => {
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
    },
    { isActive: shortcutsEnabled },
  );

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
          title={`${title} ${MEMORY_ENTITY_SCREEN_COPY.listTitleSuffix}`}
          entries={
            loading && rows.length === 0
              ? [
                  {
                    id: LOADING_ENTRY_ID,
                    label: `${MEMORY_ENTITY_SCREEN_COPY.loadingPrefix} ${title.toLowerCase()}`,
                  },
                ]
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
          <Panel title={MEMORY_ENTITY_SCREEN_COPY.readErrorTitle} width={DETAIL_WIDTH}>
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

      <Panel title={MEMORY_ENTITY_SCREEN_COPY.eventReplayTitle}>
        <Box flexDirection="column">
          <Text color={SemanticColors.primary}>
            {MEMORY_ENTITY_SCREEN_COPY.currentStatePrefix}:{" "}
            {MEMORY_ENTITY_SCREEN_COPY.eventLabel} {eventIndex + 1} of{" "}
            {MEMORY_REPLAY_EVENTS.length}
          </Text>
          <Text color={SemanticColors.secondary}>
            {MEMORY_REPLAY_EVENTS[eventIndex]}
          </Text>
        </Box>
      </Panel>

      <Panel title={MEMORY_ENTITY_SCREEN_COPY.actionHintsTitle}>
        <Box gap={2}>
          <KeyBadge char="↑↓" label={MEMORY_ENTITY_SCREEN_COPY.actionHints.select} />
          <KeyBadge
            char="["
            label={MEMORY_ENTITY_SCREEN_COPY.actionHints.previousEvent}
          />
          <KeyBadge
            char="]"
            label={MEMORY_ENTITY_SCREEN_COPY.actionHints.nextEvent}
          />
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
