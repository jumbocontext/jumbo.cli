import React from "react";
import { Box, Text } from "ink";
import { SemanticColors, TuiLayout } from "../../shared/DesignTokens.js";
import { DetailPane } from "../ui-primitives/DetailPane.js";
import { EntityColumn } from "../memory/entity-browser/EntityColumn.js";
import { Panel } from "../ui-primitives/Panel.js";
import { useSessionsList } from "../state-reading/TuiStateReader.js";
import type { SessionView } from "../../../application/context/sessions/SessionView.js";

const SESSION_LIST_WIDTH = 46;

export function SessionScreen(): React.ReactElement {
  const sessionsList = useSessionsList();
  const sessions = sessionsList.data?.sessions ?? [];
  const selectedSession = sessions[0];

  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1} gap={1}>
      <Box flexDirection="column">
        <Text color={SemanticColors.headline} bold>
          Session
        </Text>
        <Text color={SemanticColors.secondary}>
          Current session focus and history
        </Text>
      </Box>

      <Box gap={2}>
        <EntityColumn
          title="Session List"
          entries={
            sessionsList.loading && sessions.length === 0
              ? [{ id: "loading", label: "Loading sessions" }]
              : sessions.map(toSessionListEntry)
          }
          selectedId={selectedSession?.sessionId}
          isActive={true}
          width={SESSION_LIST_WIDTH}
        />

        {sessionsList.error !== null && (
          <Panel title="Read Error" width={TuiLayout.detailPanelWidth}>
            <Text color={SemanticColors.error}>{sessionsList.error.message}</Text>
          </Panel>
        )}

        {sessionsList.error === null && selectedSession && (
          <DetailPane
            title="Session Detail"
            width={TuiLayout.detailPanelWidth}
            entries={[
              { label: "ID", value: selectedSession.sessionId },
              { label: "Status", value: selectedSession.status },
              { label: "Focus", value: selectedSession.focus ?? "None" },
              { label: "Started", value: selectedSession.startedAt },
              { label: "Ended", value: selectedSession.endedAt ?? "None" },
              { label: "Updated", value: selectedSession.updatedAt },
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
