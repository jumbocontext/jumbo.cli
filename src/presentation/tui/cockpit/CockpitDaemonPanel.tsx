import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import type { TuiDaemonConfig, TuiDaemonName, TuiSubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import {
  DAEMON_PANEL_CONTENT_WIDTH,
  getGlyphCellLinePrefix,
  getGlyphCellLineSuffix,
  getGlyphCellSegments,
  getGlyphLinePrefix,
  getGlyphLineSuffix,
  getRenderedDaemonFrame,
  getStyledGlyphSegments,
  isDaemonStatusLine,
  type GlyphCell,
  type GlyphColorMap,
} from "./CockpitDaemonFrames.js";

const DAEMON_ACTIVE_VERBS = {
  reviewer: "reviewing",
  refiner: "refining",
  codifier: "codifying",
} as const satisfies Record<TuiDaemonName, string>;

const DAEMON_IDLE_VERBS = {
  reviewer: "awaiting submissions",
  refiner: "foraging",
  codifier: "awaiting approvals",
} as const satisfies Record<TuiDaemonName, string>;

const DAEMON_INFO_COPY = {
  reviewer: {
    title: "REVIEWER//",
    lines: [
      "Orchestrate background agents to automatically review goal implementations as soon as they submitted.",
      "",
      "Approved goals will get picked up by the codifier (if running).",
      "Rejected goals will get requeued with documented issues to be resolved.",
    ],
  },
  refiner: {
    title: "REFINER//",
    lines: [
      "Automatically apply relevant memories to build goal context for the implementing agent.",
      "",
      "Goals are submitted when finished and ready for implementation.",
    ],
  },
  codifier: {
    title: "CODIFIER//",
    lines: [
      "Codify implementation results automatically as soon as goals are approved.",
      "",
      "Missing decisions, components and documentation will be updated before goals are finally closed.",
    ],
  },
} as const satisfies Record<TuiDaemonName, { readonly title: string; readonly lines: readonly string[] }>;

export function CockpitDaemonPanel({
  title,
  snapshot,
  pendingConfig,
  selected,
  configuring,
  infoVisible,
  children,
}: {
  readonly title: string;
  readonly snapshot: TuiSubprocessSnapshot;
  readonly pendingConfig: TuiDaemonConfig;
  readonly selected: boolean;
  readonly configuring: boolean;
  readonly infoVisible: boolean;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <Panel
      title={title}
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

export function GlyphCellDaemonFrame({
  frame,
  frameIndex,
  snapshot,
}: {
  readonly frame: readonly (readonly GlyphCell[])[];
  readonly frameIndex: number;
  readonly snapshot: TuiSubprocessSnapshot;
}): React.ReactElement {
  const statusLabel = getDaemonPanelStatusLabel(snapshot);

  return (
    <Box flexDirection="column" flexWrap="nowrap" width={DAEMON_PANEL_CONTENT_WIDTH}>
      {getRenderedDaemonFrame(frame).map((line, lineIndex) => (
        <Text key={`${frameIndex}-${lineIndex}`}>
          {getGlyphCellSegments(
            getGlyphCellLinePrefix(line, statusLabel, lineIndex),
            snapshot,
          ).map((segment, segmentIndex) => (
            <Text
              key={`${frameIndex}-${lineIndex}-prefix-${segmentIndex}`}
              color={segment.color}>
              {segment.text}
            </Text>
          ))}
          {isDaemonStatusLine(lineIndex) && (
            <Text color={getDaemonStatusColor()} bold>
              {statusLabel}
            </Text>
          )}
          {getGlyphCellSegments(
            getGlyphCellLineSuffix(line, statusLabel, lineIndex),
            snapshot,
          ).map((segment, segmentIndex) => (
            <Text
              key={`${frameIndex}-${lineIndex}-suffix-${segmentIndex}`}
              color={segment.color}>
              {segment.text}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
}

export function CodifierDaemonFrame({
  frame,
  frameIndex,
  glyphColors,
  snapshot,
}: {
  readonly frame: readonly string[];
  readonly frameIndex: number;
  readonly glyphColors: GlyphColorMap;
  readonly snapshot: TuiSubprocessSnapshot;
}): React.ReactElement {
  const statusLabel = getDaemonPanelStatusLabel(snapshot);

  return (
    <Box flexDirection="column" flexWrap="nowrap" width={DAEMON_PANEL_CONTENT_WIDTH}>
      {getRenderedDaemonFrame(frame).map((line, lineIndex) => (
        <Text key={`${frameIndex}-${lineIndex}`}>
          {getStyledGlyphSegments(getGlyphLinePrefix(line, statusLabel, lineIndex), glyphColors, snapshot).map((segment, segmentIndex) => (
            <Text
              key={`${frameIndex}-${lineIndex}-prefix-${segmentIndex}`}
              color={segment.color}
              dimColor={segment.dimColor}>
              {segment.text}
            </Text>
          ))}
          {isDaemonStatusLine(lineIndex) && (
            <Text color={getDaemonStatusColor()} bold>
              {statusLabel}
            </Text>
          )}
          {getStyledGlyphSegments(getGlyphLineSuffix(line, statusLabel, lineIndex), glyphColors, snapshot).map((segment, segmentIndex) => (
            <Text
              key={`${frameIndex}-${lineIndex}-suffix-${segmentIndex}`}
              color={segment.color}
              dimColor={segment.dimColor}>
              {segment.text}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
}

export function DaemonInfoOverlay({
  name,
}: {
  readonly name: TuiDaemonName;
}): React.ReactElement {
  const info = DAEMON_INFO_COPY[name];

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
  const action = snapshot.status === "running" ? "stop" : "start";
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
  const config = snapshot.status === "running" ? snapshot.config : pendingConfig;
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

function getDaemonPanelStatusLabel(snapshot: TuiSubprocessSnapshot): string {
  const latestEvent = snapshot.events[snapshot.events.length - 1];
  if (snapshot.status === "running" && latestEvent?.status === "idle") {
    return `[ ${DAEMON_IDLE_VERBS[snapshot.name]} ]`;
  }

  const status = snapshot.status === "running"
    ? DAEMON_ACTIVE_VERBS[snapshot.name]
    : snapshot.status;

  return `[ ${status} ]`;
}

function getDaemonStatusColor(): string {
  return BaseColors.shade3;
}
