import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import type { TuiDaemonConfig, TuiSubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import { TuiSubprocessStatus } from "../daemon-subprocesses/Constants.js";
import { DAEMON_PANEL_CONTENT_WIDTH } from "./CockpitDaemonFrames.js";
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
  readonly snapshot: TuiSubprocessSnapshot;
  readonly pendingConfig: TuiDaemonConfig;
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

export function DaemonInfoOverlay({
  daemonConstants,
}: {
  readonly daemonConstants: IDaemonConstants;
}): React.ReactElement {
  const info = daemonConstants.info;

  return (
    <Box
      borderStyle="round"
      borderColor={BaseColors.brandBlue}
      flexDirection="column"
      marginBottom={1}
      paddingX={1}
      width="100%"
    >
      <Text color={BaseColors.brandBlue} bold>
        {info.title}
      </Text>
      {info.lines.map((line) => (
        <Text key={line} color={BaseColors.shade2}>
          {line}
        </Text>
      ))}
      <Text color={BaseColors.shade4}>
        [i] close
      </Text>
    </Box>
  );
}

function DaemonActionLine({
  snapshot,
  selected,
  infoVisible,
}: {
  readonly snapshot: TuiSubprocessSnapshot;
  readonly selected: boolean;
  readonly infoVisible: boolean;
}): React.ReactElement {
  const action =
    snapshot.status === TuiSubprocessStatus.RUNNING ? "stop" : "start";
  const badgeColor = getDaemonShortcutBadgeColor(selected);

  return (
    <Box width={DAEMON_PANEL_CONTENT_WIDTH} marginTop={1} gap={1}>
      <KeyBadge
        char="s"
        label={action}
        color={badgeColor}
        labelColor={BaseColors.shade4}
      />
      <KeyBadge
        char="@"
        label="config"
        color={badgeColor}
        labelColor={BaseColors.shade4}
      />
      <KeyBadge
        char="i"
        label={infoVisible ? "info open" : "info"}
        color={badgeColor}
        labelColor={BaseColors.shade4}
      />
    </Box>
  );
}

function DaemonConfigWizard({
  snapshot,
  pendingConfig,
  selected,
}: {
  readonly snapshot: TuiSubprocessSnapshot;
  readonly pendingConfig: TuiDaemonConfig;
  readonly selected: boolean;
}): React.ReactElement {
  const config =
    snapshot.status === TuiSubprocessStatus.RUNNING
      ? snapshot.config
      : pendingConfig;
  const badgeColor = getDaemonShortcutBadgeColor(selected);

  return (
    <Box width={DAEMON_PANEL_CONTENT_WIDTH} flexDirection="column">
      <Text color={BaseColors.shade4}>
        pid {snapshot.pid ?? "-"}
      </Text>
      <Box gap={1}>
        <KeyBadge
          char="a"
          label={config.agentId}
          color={badgeColor}
          labelColor={BaseColors.shade4}
        />
        <KeyBadge
          char="p"
          label={`${Math.round(config.pollIntervalMs / 1000)}s`}
          color={badgeColor}
          labelColor={BaseColors.shade4}
        />
        <KeyBadge
          char="x"
          label={String(config.maxRetries)}
          color={badgeColor}
          labelColor={BaseColors.shade4}
        />
      </Box>
    </Box>
  );
}

function getDaemonShortcutBadgeColor(selected: boolean): string {
  return selected ? BaseColors.brandBlue : BaseColors.shade4;
}

