import React from "react";
import { Box, Text } from "ink";
import { SemanticColors, TuiLayout } from "../../shared/DesignTokens.js";
import { DetailPane } from "../ui-primitives/DetailPane.js";
import { EntityColumn } from "../memory/entity-browser/EntityColumn.js";
import { Panel } from "../ui-primitives/Panel.js";
import { useSessionsList } from "../state-reading/TuiStateReader.js";
import type { SessionView } from "../../../application/context/sessions/SessionView.js";

const SESSION_LIST_WIDTH = 46;
const SESSION_LOADING_ENTRY_ID = "loading";
const SESSION_SCREEN_COPY = {
  title: "Session",
  subtitle: "Current session focus and history",
  listTitle: "Session List",
  loadingLabel: "Loading sessions",
  readErrorTitle: "Read Error",
  detailTitle: "Session Detail",
  emptyValue: "None",
  detailLabels: {
    id: "ID",
    status: "Status",
    focus: "Focus",
    started: "Started",
    ended: "Ended",
    updated: "Updated",
  },
} as const;

export function SessionScreen(): React.ReactElement {
  const sessionsList = useSessionsList();
  const sessions = sessionsList.data?.sessions ?? [];
  const selectedSession = sessions[0];

  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1} gap={1}>
      <Box flexDirection="column">
        <Text color={SemanticColors.headline} bold>
          {SESSION_SCREEN_COPY.title}
        </Text>
        <Text color={SemanticColors.secondary}>
          {SESSION_SCREEN_COPY.subtitle}
        </Text>
      </Box>

      <Box gap={2}>
        <EntityColumn
          title={SESSION_SCREEN_COPY.listTitle}
          entries={
            sessionsList.loading && sessions.length === 0
              ? [
                  {
                    id: SESSION_LOADING_ENTRY_ID,
                    label: SESSION_SCREEN_COPY.loadingLabel,
                  },
                ]
              : sessions.map(toSessionListEntry)
          }
          selectedId={selectedSession?.sessionId}
          isActive={true}
          width={SESSION_LIST_WIDTH}
        />

        {sessionsList.error !== null && (
          <Panel title={SESSION_SCREEN_COPY.readErrorTitle} width={TuiLayout.detailPanelWidth}>
            <Text color={SemanticColors.error}>{sessionsList.error.message}</Text>
          </Panel>
        )}

        {sessionsList.error === null && selectedSession && (
          <DetailPane
            title={SESSION_SCREEN_COPY.detailTitle}
            width={TuiLayout.detailPanelWidth}
            entries={[
              {
                label: SESSION_SCREEN_COPY.detailLabels.id,
                value: selectedSession.sessionId,
              },
              {
                label: SESSION_SCREEN_COPY.detailLabels.status,
                value: selectedSession.status,
              },
              {
                label: SESSION_SCREEN_COPY.detailLabels.focus,
                value: selectedSession.focus ?? SESSION_SCREEN_COPY.emptyValue,
              },
              {
                label: SESSION_SCREEN_COPY.detailLabels.started,
                value: selectedSession.startedAt,
              },
              {
                label: SESSION_SCREEN_COPY.detailLabels.ended,
                value: selectedSession.endedAt ?? SESSION_SCREEN_COPY.emptyValue,
              },
              {
                label: SESSION_SCREEN_COPY.detailLabels.updated,
                value: selectedSession.updatedAt,
              },
            ]}
          />
        )}
      </Box>
    </Box>
  );
}

function toSessionListEntry(session: SessionView) {
  return {
    id: session.sessionId,
    label: `${session.status} ${session.focus ?? session.sessionId}`,
  };
}
