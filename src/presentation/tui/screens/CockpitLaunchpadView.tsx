import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { SectionHeading } from "../components/SectionHeading.js";
import { BaseColors } from "../../shared/DesignTokens.js";
import { useProjectContext } from "../state/TuiStateReader.js";
import { useSubprocessManager } from "../subprocess/SubprocessManagerContext.js";
import type { ISubprocessManager, TuiDaemonConfig, TuiDaemonName, TuiSubprocessSnapshot } from "../subprocess/ISubprocessManager.js";

interface GlyphStyle {
  color: string;
  dimColor?: boolean;
}

type GlyphColorMap = Readonly<Record<string, string>>;
type GlyphPalette = readonly string[];

interface RefinerGlyphCell {
  glyph: string;
  color: string;
}

const REFINER_FRAME_COUNT = 9;
const REFINER_GRID_WIDTH = 35;
const REFINER_GRID_HEIGHT = 10;
const REFINER_GRID_SIZE = REFINER_GRID_WIDTH * REFINER_GRID_HEIGHT;
const REVIEWER_FRAME_COUNT = 6;
const CODIFIER_FRAME_COUNT = 6;
const CODIFIER_GRID_WIDTH = 35;
const CODIFIER_GRID_HEIGHT = 10;
const CODIFIER_GROUP_LENGTH = 4;
const CODIFIER_ROW_REPEAT_COUNT = 7;
const DEFAULT_REFINER_FRAME_DURATION_MS = 500;
const DEFAULT_REVIEWER_FRAME_DURATION_MS = 350;
const DEFAULT_CODIFIER_FRAME_DURATION_MS = 200;
const DEFAULT_CODIFIER_GLYPH_STYLE: GlyphStyle = {
  color: BaseColors.shade3,
  dimColor: false,
};
const AGENT_OPTIONS = ["codex", "claude", "gemini", "copilot", "cursor", "vibe"] as const;
const POLL_INTERVAL_OPTIONS_MS = [10_000, 30_000, 60_000, 120_000] as const;
const RETRY_OPTIONS = [1, 2, 3, 5] as const;

const REFINER_GLYPHS = [
  "•",
] as const;

const CODIFIER_ALPHANUMERIC_GLYPHS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
] as const;

const REFINER_GLYPH_COLORS = [
  BaseColors.tint1,
  BaseColors.primary,
  BaseColors.shade1,
  BaseColors.shade2,
  BaseColors.shade3,
  BaseColors.shade4,
  BaseColors.shade5,
  BaseColors.shade6,
] as const;

const DEFAULT_CODIFIER_GLYPH_COLORS: GlyphColorMap = {
  "█": BaseColors.shade1,
  "░": BaseColors.shade2,
};
const DEFAULT_REVIEWER_GLYPH_COLORS: GlyphColorMap = {
  "█": BaseColors.primary,
  "░": BaseColors.shade3,
  "│": BaseColors.shade6,
};

interface CockpitLaunchpadViewProps {
  refinerGlyphPalette?: GlyphPalette;
  reviewerGlyphColors?: GlyphColorMap;
  codifierGlyphColors?: GlyphColorMap;
  refinerFrameDurationMs?: number;
  reviewerFrameDurationMs?: number;
  codifierFrameDurationMs?: number;
}

export function CockpitLaunchpadView({
  refinerGlyphPalette = REFINER_GLYPH_COLORS,
  reviewerGlyphColors = DEFAULT_REVIEWER_GLYPH_COLORS,
  codifierGlyphColors = DEFAULT_CODIFIER_GLYPH_COLORS,
  refinerFrameDurationMs = DEFAULT_REFINER_FRAME_DURATION_MS,
  reviewerFrameDurationMs = DEFAULT_REVIEWER_FRAME_DURATION_MS,
  codifierFrameDurationMs = DEFAULT_CODIFIER_FRAME_DURATION_MS,
}: CockpitLaunchpadViewProps = {}): React.ReactElement {
  const currentDirectory = process.cwd();
  const subprocessManager = useSubprocessManager();
  const projectContext = useProjectContext();
  const projectName = projectContext.data?.name ?? "Jumbo";
  const projectPurpose =
    projectContext.data?.purpose ?? "Project context has not been loaded.";
  const [reviewerFrameIndex, setReviewerFrameIndex] = useState(0);
  const [refinerFrameIndex, setRefinerFrameIndex] = useState(0);
  const [codifierFrameIndex, setCodifierFrameIndex] = useState(0);
  const [daemonConfig, setDaemonConfig] = useState<TuiDaemonConfig>({
    agentId: "codex",
    pollIntervalMs: 30_000,
    maxRetries: 3,
  });
  const [daemonStatuses, setDaemonStatuses] = useState<readonly TuiSubprocessSnapshot[]>(
    subprocessManager.getAllStatuses(),
  );

  useEffect(() => {
    if (reviewerFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setReviewerFrameIndex((previousFrameIndex) =>
        (previousFrameIndex + 1) % REVIEWER_FRAME_COUNT
      );
    }, reviewerFrameDurationMs);

    return () => clearInterval(timer);
  }, [reviewerFrameDurationMs]);

  useEffect(() => {
    if (REFINER_FRAME_COUNT <= 1 || refinerFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setRefinerFrameIndex((previousFrameIndex) =>
        (previousFrameIndex + 1) % REFINER_FRAME_COUNT
      );
    }, refinerFrameDurationMs);

    return () => clearInterval(timer);
  }, [refinerFrameDurationMs]);

  useEffect(() => {
    if (codifierFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setCodifierFrameIndex((previousFrameIndex) =>
        (previousFrameIndex + 1) % CODIFIER_FRAME_COUNT
      );
    }, codifierFrameDurationMs);

    return () => clearInterval(timer);
  }, [codifierFrameDurationMs]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDaemonStatuses(subprocessManager.getAllStatuses());
    }, 500);

    return () => clearInterval(timer);
  }, [subprocessManager]);

  useInput((input) => {
    if (input === "v" || input === "V") {
      void toggleDaemon("reviewer", subprocessManager, daemonConfig, setDaemonStatuses);
    }
    if (input === "r" || input === "R") {
      void toggleDaemon("refiner", subprocessManager, daemonConfig, setDaemonStatuses);
    }
    if (input === "c" || input === "C") {
      void toggleDaemon("codifier", subprocessManager, daemonConfig, setDaemonStatuses);
    }
    if (input === "a" || input === "A") {
      setDaemonConfig((config) => nextAgentConfig(config));
    }
    if (input === "p" || input === "P") {
      setDaemonConfig((config) => nextPollConfig(config));
    }
    if (input === "x" || input === "X") {
      setDaemonConfig((config) => nextRetryConfig(config));
    }
  });

  const reviewerStatus = findDaemonStatus(daemonStatuses, "reviewer");
  const refinerStatus = findDaemonStatus(daemonStatuses, "refiner");
  const codifierStatus = findDaemonStatus(daemonStatuses, "codifier");

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Top row */}
      <Box flexDirection="row" flexGrow={1} flexBasis={0} width="100%">
        <Box
          flexDirection="column"
          flexGrow={1}
          flexBasis={0}
          height="100%"
          padding={1}>
            <Text color={BaseColors.shade3} bold>
              PROJECT// <Text color={BaseColors.shade3}>{currentDirectory}</Text>
            </Text>
            <Box flexDirection="column" marginTop={1}>
              <Text color={BaseColors.shade3}>
              Name: <Text color={BaseColors.shade2}>{projectName}</Text>
            </Text>
            <Text color={BaseColors.shade3}>
              Purpose: 
            </Text>
            <Text color={BaseColors.shade1}>
                {projectPurpose}
            </Text>
            </Box>
        </Box>
        <Box
          flexDirection="column"
          flexGrow={1}
          flexBasis={0}
          height="100%"
          padding={1}>
          <Text color={BaseColors.shade2} bold>
            SESSION//
          </Text>
        </Box>
      </Box>
      {/* Bottom row */}
      <Box flexDirection="row" flexGrow={1} flexBasis={0} width="100%">
        <Box
          flexDirection="column"
          flexGrow={1}
          flexBasis={0}
          height="100%"
          alignItems="center"
          padding={1}>
          <Box width={35} alignItems="center">
            <Text color={BaseColors.shade3} bold>
              REVIEWER// <Text color={BaseColors.shade4}>({reviewerStatus.status})</Text>
            </Text>
          </Box>
          <DaemonControlLine shortcut="v" snapshot={reviewerStatus} pendingConfig={daemonConfig} />
          <Box flexDirection="column" flexWrap="nowrap" width={35}>
            {getReviewerFrame(reviewerFrameIndex).map((line, lineIndex) => (
              <Text key={`${reviewerFrameIndex}-${lineIndex}`}>
                {getStyledGlyphSegments(line, reviewerGlyphColors).map((segment, segmentIndex) => (
                  <Text
                    key={`${reviewerFrameIndex}-${lineIndex}-${segmentIndex}`}
                    color={segment.color}
                    dimColor={segment.dimColor}>
                    {segment.text}
                  </Text>
                ))}
              </Text>
            ))}
          </Box>
        </Box>
        <Box
          flexDirection="column"
          flexGrow={1}
          flexBasis={0}
          height="100%"
          alignItems="center"
          padding={1}>
          <Box width={35} alignItems="center">
            <Text color={BaseColors.shade3} bold>
              REFINER// <Text color={BaseColors.shade4}>({refinerStatus.status})</Text>
            </Text>
          </Box>
          <DaemonControlLine shortcut="r" snapshot={refinerStatus} pendingConfig={daemonConfig} />
          <Box flexDirection="column" flexWrap="nowrap" width={35}>
            {getRefinerFrame(refinerFrameIndex, refinerGlyphPalette).map((line, lineIndex) => (
              <Text key={`${refinerFrameIndex}-${lineIndex}`}>
                {getRefinerGlyphSegments(line).map((segment, segmentIndex) => (
                  <Text
                    key={`${refinerFrameIndex}-${lineIndex}-${segmentIndex}`}
                    color={segment.color}>
                    {segment.text}
                  </Text>
                ))}
              </Text>
            ))}
          </Box>
        </Box>
        <Box
          flexDirection="column"
          flexGrow={1}
          flexBasis={0}
          height="100%"
          alignItems="center"
          padding={1}>
          <Box width={35} alignItems="center">
            <Text color={BaseColors.shade3} bold>
              CODIFIER// <Text color={BaseColors.shade4}>({codifierStatus.status})</Text>
            </Text>
          </Box>
          <DaemonControlLine shortcut="c" snapshot={codifierStatus} pendingConfig={daemonConfig} />
          <Box flexDirection="column" flexWrap="nowrap" width={35}>
            {getCodifierFrame(codifierFrameIndex).map((line, lineIndex) => (
              <Text key={`${codifierFrameIndex}-${lineIndex}`}>
                {getStyledGlyphSegments(line, codifierGlyphColors).map((segment, segmentIndex) => (
                  <Text
                    key={`${codifierFrameIndex}-${lineIndex}-${segmentIndex}`}
                    color={segment.color}
                    dimColor={segment.dimColor}>
                    {segment.text}
                  </Text>
                ))}
              </Text>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function DaemonControlLine({
  shortcut,
  snapshot,
  pendingConfig,
}: {
  readonly shortcut: string;
  readonly snapshot: TuiSubprocessSnapshot;
  readonly pendingConfig: TuiDaemonConfig;
}): React.ReactElement {
  const action = snapshot.status === "running" ? "stop" : "start";
  const config = snapshot.status === "running" ? snapshot.config : pendingConfig;
  const activity = formatDaemonActivity(snapshot);
  const tail = snapshot.stderr[snapshot.stderr.length - 1] ?? snapshot.stdout[snapshot.stdout.length - 1] ?? "";

  return (
    <Box width={35} flexDirection="column">
      <Text color={BaseColors.shade4}>
        [{shortcut}] {action} pid {snapshot.pid ?? "-"}
      </Text>
      <Text color={BaseColors.shade4}>
        [a] {config.agentId} [p] {Math.round(config.pollIntervalMs / 1000)}s [x] {config.maxRetries}
      </Text>
      <Text color={activity.color}>
        {activity.label}
      </Text>
      {tail.length > 0 && (
        <Text color={snapshot.status === "failed" ? BaseColors.brandRed : BaseColors.shade5}>
          {truncateTail(tail)}
        </Text>
      )}
    </Box>
  );
}

async function toggleDaemon(
  name: TuiDaemonName,
  manager: ISubprocessManager,
  config: TuiDaemonConfig,
  setDaemonStatuses: (statuses: readonly TuiSubprocessSnapshot[]) => void,
): Promise<void> {
  const snapshot = manager.getStatus(name);
  if (snapshot.status === "running") {
    await manager.terminate(name);
  } else {
    await manager.spawn(name, config);
  }
  setDaemonStatuses(manager.getAllStatuses());
}

function findDaemonStatus(
  statuses: readonly TuiSubprocessSnapshot[],
  name: TuiDaemonName,
): TuiSubprocessSnapshot {
  return statuses.find((status) => status.name === name) ?? {
    name,
    status: "stopped",
    config: {
      agentId: "codex",
      pollIntervalMs: 30_000,
      maxRetries: 3,
    },
    stdout: [],
    stderr: [],
    events: [],
  };
}

function formatDaemonActivity(snapshot: TuiSubprocessSnapshot): { label: string; color: string } {
  const latestEvent = snapshot.events[snapshot.events.length - 1];
  if (latestEvent === undefined) {
    if (snapshot.status === "running") {
      return { label: "starting daemon", color: BaseColors.brandBlue };
    }
    return { label: "idle", color: BaseColors.shade5 };
  }

  if (latestEvent.status === "idle") {
    return { label: "foraging for goals", color: BaseColors.shade4 };
  }
  if (latestEvent.status === "processing" || latestEvent.status === "codifying") {
    return {
      label: `${daemonVerb(snapshot.name)} ${shortGoalId(latestEvent.goalId)} ${latestEvent.attempt ?? "-"} / ${latestEvent.maxRetries ?? "-"}`,
      color: BaseColors.brandBlue,
    };
  }
  if (latestEvent.status === "completed") {
    return {
      label: `refined ${shortGoalId(latestEvent.goalId)} in ${latestEvent.attempt ?? 1} attempt`,
      color: BaseColors.brandGreen,
    };
  }
  if (latestEvent.status === "skipped" || latestEvent.status === "exhausted") {
    return {
      label: `${latestEvent.status} ${shortGoalId(latestEvent.goalId)} after ${latestEvent.maxRetries ?? snapshot.config.maxRetries}`,
      color: BaseColors.brandYellow,
    };
  }
  if (latestEvent.status === "failed") {
    return {
      label: truncateTail(latestEvent.errorMessage ?? "daemon failed"),
      color: BaseColors.brandRed,
    };
  }

  return { label: latestEvent.status, color: BaseColors.shade4 };
}

function shortGoalId(goalId: string | undefined): string {
  if (goalId === undefined) {
    return "-";
  }
  return goalId.length > 8 ? goalId.slice(0, 8) : goalId;
}

function daemonVerb(name: TuiDaemonName): string {
  if (name === "reviewer") {
    return "reviewing";
  }
  if (name === "codifier") {
    return "codifying";
  }
  return "refining";
}

function nextAgentConfig(config: TuiDaemonConfig): TuiDaemonConfig {
  const currentIndex = AGENT_OPTIONS.indexOf(config.agentId as typeof AGENT_OPTIONS[number]);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % AGENT_OPTIONS.length;
  return { ...config, agentId: AGENT_OPTIONS[nextIndex] };
}

function nextPollConfig(config: TuiDaemonConfig): TuiDaemonConfig {
  const currentIndex = POLL_INTERVAL_OPTIONS_MS.indexOf(config.pollIntervalMs as typeof POLL_INTERVAL_OPTIONS_MS[number]);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % POLL_INTERVAL_OPTIONS_MS.length;
  return { ...config, pollIntervalMs: POLL_INTERVAL_OPTIONS_MS[nextIndex] };
}

function nextRetryConfig(config: TuiDaemonConfig): TuiDaemonConfig {
  const currentIndex = RETRY_OPTIONS.indexOf(config.maxRetries as typeof RETRY_OPTIONS[number]);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % RETRY_OPTIONS.length;
  return { ...config, maxRetries: RETRY_OPTIONS[nextIndex] };
}

function truncateTail(text: string, max = 35): string {
  return text.length <= max ? text : text.slice(0, max - 3) + "...";
}

export function getCodifierFrame(index: number): string[] {
  if (index < 0 || index >= CODIFIER_FRAME_COUNT) {
    return ["error"];
  }

  const random = createSeededRandom(createSeed(index + CODIFIER_FRAME_COUNT));

  return Array.from({ length: CODIFIER_GRID_HEIGHT }, () => {
    const groups = new Set<string>();

    while (groups.size < CODIFIER_ROW_REPEAT_COUNT) {
      groups.add(
        Array.from({ length: CODIFIER_GROUP_LENGTH }, () =>
          pickRandomValue(CODIFIER_ALPHANUMERIC_GLYPHS, random)
        ).join("")
      );
    }

    return Array.from(groups).map((group) => `${group}.`).join("");
  });
}

function getReviewerFrame(index: number): string[] {
  switch(index) { 
    case 0: {
      return [
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "  ███ ███ ███ ███ ███ ███ ███ ███  ",
        "  ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░ ░░░  ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
      ];
    }
    case 1: {
      return [
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "  ███  │   │   │  ███  │  ███ ███  ",
        "  ░░░ ███  │  ███ ░░░ ███ ░░░ ░░░  ",
        "   │  ░░░ ███ ░░░  │  ░░░  │   │   ",
        "   │   │  ░░░  │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
      ];
    }
    case 2: {
      return [
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "  ███  │   │   │   │   │   │  ███  ",
        "  ░░░  │   │  ███  │  ███  │  ░░░  ",
        "   │  ███  │  ░░░ ███ ░░░ ███  │   ",
        "   │  ░░░  │   │  ░░░  │  ░░░  │   ",
        "   │   │  ███  │   │   │   │   │   ",
        "   │   │  ░░░  │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
      ];
    }
    case 3: {
      return [
        "   │   │   │   │   │   │   │   │   ",
        "  ███  │   │   │   │   │   │   │   ",
        "  ░░░  │   │   │   │  ███  │  ███  ",
        "   │  ███  │   │   │  ░░░ ███ ░░░  ",
        "   │  ░░░  │  ███  │   │  ░░░  │   ",
        "   │   │   │  ░░░ ███  │   │   │   ",
        "   │   │   │   │  ░░░  │   │   │   ",
        "   │   │  ███  │   │   │   │   │   ",
        "   │   │  ░░░  │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
      ];
    }
    case 4: {
      return [
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "  ███  │   │   │   │   │   │  ███  ",
        "  ░░░  │   │  ███  │  ███  │  ░░░  ",
        "   │  ███  │  ░░░ ███ ░░░ ███  │   ",
        "   │  ░░░  │   │  ░░░  │  ░░░  │   ",
        "   │   │  ███  │   │   │   │   │   ",
        "   │   │  ░░░  │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
      ];
    }
    case 5: {
      return [
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "  ███  │   │   │   │   │   │  ███  ",
        "  ░░░  │   │  ███  │  ███  │  ░░░  ",
        "   │  ███  │  ░░░ ███ ░░░ ███  │   ",
        "   │  ░░░  │   │  ░░░  │  ░░░  │   ",
        "   │   │  ███  │   │   │   │   │   ",
        "   │   │  ░░░  │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
        "   │   │   │   │   │   │   │   │   ",
      ];
    }
    default: {
      return [
        "error"
      ];
    }
  }
}

function getRefinerFrame(
  index: number,
  glyphPalette: GlyphPalette,
): RefinerGlyphCell[][] {
  if (index < 0 || index >= REFINER_FRAME_COUNT) {
    return [[{ glyph: "error", color: DEFAULT_CODIFIER_GLYPH_STYLE.color }]];
  }

  const glyphGrid = createRefinerGlyphGrid(index, glyphPalette);

  return Array.from({ length: REFINER_GRID_HEIGHT }, (_, rowIndex) => {
    const start = rowIndex * REFINER_GRID_WIDTH;
    return glyphGrid.slice(start, start + REFINER_GRID_WIDTH);
  });
}

function getRefinerGlyphSegments(
  line: RefinerGlyphCell[],
): Array<{ text: string; color: string }> {
  const segments: Array<{ text: string; color: string }> = [];

  for (const cell of line) {
    const previousSegment = segments[segments.length - 1];

    if (previousSegment !== undefined && previousSegment.color === cell.color) {
      previousSegment.text += cell.glyph;
      continue;
    }

    segments.push({ text: cell.glyph, color: cell.color });
  }

  return segments;
}

function getStyledGlyphSegments(
  line: string,
  glyphColors: GlyphColorMap,
): Array<GlyphStyle & { text: string }> {
  const segments: Array<GlyphStyle & { text: string }> = [];

  for (const character of line) {
    const glyphStyle = getGlyphStyle(character, glyphColors);
    const previousSegment = segments[segments.length - 1];

    if (
      previousSegment !== undefined
      && previousSegment.color === glyphStyle.color
      && previousSegment.dimColor === glyphStyle.dimColor
    ) {
      previousSegment.text += character;
      continue;
    }

    segments.push({
      text: character,
      color: glyphStyle.color,
      dimColor: glyphStyle.dimColor,
    });
  }

  return segments;
}

function getGlyphStyle(
  character: string,
  glyphColors: GlyphColorMap,
): GlyphStyle {
  const color = glyphColors[character];

  if (color === undefined) {
    return DEFAULT_CODIFIER_GLYPH_STYLE;
  }

  return { color };
}

function createRefinerGlyphGrid(
  frameIndex: number,
  glyphPalette: GlyphPalette,
): RefinerGlyphCell[] {
  const random = createSeededRandom(createSeed(frameIndex));

  return Array.from({ length: REFINER_GRID_SIZE }, () => ({
    glyph: pickRandomValue(REFINER_GLYPHS, random),
    color: pickRandomValue(glyphPalette, random),
  }));
}

function createSeed(frameIndex: number): number {
  return (frameIndex + 1) * 1009 + REFINER_GRID_SIZE * 9176;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickRandomValue<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)];
}
