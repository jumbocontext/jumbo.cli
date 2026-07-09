import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";
import type { DaemonConfig, SubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import { DaemonActionLine } from "./DaemonActionLine.js";
import { DaemonConfigWizard } from "./DaemonConfigWizard.js";
import type { IDaemonConstants } from "./daemons/IDaemonConstants.js";

export function CockpitDaemonPanel({
  daemonConstants,
  snapshot,
  pendingConfig,
  selected,
  configuring,
  infoVisible,
  children,
}: {
  readonly daemonConstants: IDaemonConstants;
  readonly snapshot: SubprocessSnapshot;
  readonly pendingConfig: DaemonConfig;
  readonly selected: boolean;
  readonly configuring: boolean;
  readonly infoVisible: boolean;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <Panel
      title={daemonConstants.title}
      titleColor={selected ? BaseColors.brandBlue : BaseColors.shade3}
      borderColor={selected ? BaseColors.brandBlue : BaseColors.shade5}
      flexGrow={3}
      flexBasis={0}
      height="100%"
      bordered={false}
    >
      <Box alignItems="center" flexDirection="column">
        {children}
        <DaemonActionLine
          snapshot={snapshot}
          selected={selected}
          infoVisible={infoVisible}
        />
        <DaemonActivityLine snapshot={snapshot} />
        {configuring && (
          <DaemonConfigWizard
            snapshot={snapshot}
            pendingConfig={pendingConfig}
            selected={selected}
          />
        )}
      </Box>
    </Panel>
  );
}

function DaemonActivityLine({
  snapshot,
}: {
  readonly snapshot: SubprocessSnapshot;
}): React.ReactElement {
  const latestEvent = snapshot.events[snapshot.events.length - 1];
  const event = [...snapshot.events].reverse().find((candidate) =>
    candidate.category !== "heartbeat" && candidate.category !== "waiting" && candidate.category !== "foraging"
  ) ?? latestEvent;

  if (event === undefined) {
    return (
      <Box width="100%" justifyContent="center">
        <Text color={BaseColors.shade5}>no recent daemon activity</Text>
      </Box>
    );
  }

  const parts = [
    event.goalId === undefined ? undefined : shortGoalId(event.goalId),
    event.attempt === undefined && event.maxRetries === undefined
      ? undefined
      : `${event.attempt ?? "-"}/${event.maxRetries ?? "-"}`,
    event.phase,
    formatElapsed(latestElapsedMs(event, latestEvent)),
    event.message,
  ].filter((part): part is string => part !== undefined && part.trim().length > 0);

  return (
    <Box width="100%" justifyContent="center">
      <Text color={BaseColors.shade4}>{truncateTail(parts.join(" "), 60)}</Text>
    </Box>
  );
}

function latestElapsedMs(
  meaningfulEvent: SubprocessSnapshot["events"][number],
  latestEvent: SubprocessSnapshot["events"][number] | undefined,
): number | undefined {
  if (
    latestEvent?.category === "heartbeat" &&
    (latestEvent.goalId === undefined || latestEvent.goalId === meaningfulEvent.goalId)
  ) {
    return latestEvent.elapsedMs ?? meaningfulEvent.elapsedMs;
  }

  return meaningfulEvent.elapsedMs;
}

function shortGoalId(goalId: string): string {
  return goalId.length > 8 ? goalId.slice(0, 8) : goalId;
}

function formatElapsed(elapsedMs: number | undefined): string | undefined {
  return elapsedMs === undefined ? undefined : `${Math.max(0, Math.floor(elapsedMs / 1000))}s`;
}

function truncateTail(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 3) + "...";
}

