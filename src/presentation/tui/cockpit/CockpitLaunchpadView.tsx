import React, { useCallback, useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import AnimatedBillboard from "../billboard/AnimatedBillboard.js";
import type { AnimatedBillboardTriggerInput } from "../billboard/AnimatedBillboard.js";
import { BaseColors } from "../../shared/DesignTokens.js";
import { useSubprocessManager } from "../daemon-subprocesses/useSubprocessManager.js";
import { DEFAULT_WORKER_DAEMON_CONFIGS } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";
import type {
  ISubprocessManager,
  TuiDaemonConfig,
  TuiDaemonConfigs,
  TuiDaemonName,
  TuiSubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { TuiSubprocessStatus } from "../daemon-subprocesses/TuiSubprocessStatus.js";
import {
  appendDaemonEventRows,
  findDaemonStatus,
  formatDaemonEventRow,
  getDaemonEventRows,
  type DaemonEventRow,
} from "./CockpitDaemonEvents.js";
import {
  getNextFocusedDaemon,
  nextAgentConfig,
  nextDaemonConfigs,
  nextPollConfig,
  nextRetryConfig,
} from "./CockpitDaemonConfiguration.js";
import {
  CODIFIER_FRAME_COUNT,
  DEFAULT_CODIFIER_FRAME_DURATION_MS,
  DEFAULT_CODIFIER_GLYPH_COLORS,
  DEFAULT_RANDOM_GLYPH_COLORS,
  DEFAULT_REFINER_FRAME_DURATION_MS,
  DEFAULT_REVIEWER_FRAME_DURATION_MS,
  REFINER_FRAME_COUNT,
  REVIEWER_FRAME_COUNT,
  getCodifierFrame,
  getRenderedFrameIndex,
  getReviewerFrame,
  type GlyphColorMap,
  type GlyphPalette,
} from "./CockpitDaemonFrames.js";
import { CockpitDaemonPanel, DaemonInfoOverlay } from "./CockpitDaemonPanel.js";
import { CockpitLaunchpadCopy } from "./CockpitLaunchpadCopy.js";
import { CockpitLaunchpadWelcome } from "./CockpitLaunchpadWelcome.js";
import { getDaemonPanelStatusLabel } from "./DaemonPanelStatusLabel.js";
import { CodifierDaemonConstants } from "./daemons/CodifierDaemonConstants.js";
import { CodifierDaemonFrame } from "./daemons/CodifierDaemonFrame.js";
import { RefinerDaemonConstants } from "./daemons/RefinerDaemonConstants.js";
import { RefinerDaemonFrame } from "./daemons/RefinerDaemonFrame.js";
import { ReviewerDaemonConstants } from "./daemons/ReviewerDaemonConstants.js";
import { ReviewerDaemonFrame } from "./daemons/ReviewerDaemonFrame.js";
import type { IDaemonUiDefinition } from "./daemons/IDaemonUiDefinition.js";

interface LaunchAnimationSize {
  readonly width: number;
  readonly height: number;
}

export type LaunchAnimationRenderer = (
  input: AnimatedBillboardTriggerInput,
) => React.ReactElement;

interface CockpitLaunchpadViewProps {
  shortcutsEnabled?: boolean;
  launchAnimationSize?: LaunchAnimationSize;
  onLaunchAnimationDone?: () => void;
  launchAnimationRenderer?: LaunchAnimationRenderer;
  refinerGlyphPalette?: GlyphPalette;
  reviewerGlyphPalette?: GlyphPalette;
  codifierGlyphColors?: GlyphColorMap;
  refinerFrameDurationMs?: number;
  reviewerFrameDurationMs?: number;
  codifierFrameDurationMs?: number;
  settingsReader?: Pick<ISettingsReader, "read" | "write">;
}

const DAEMON_UI_DEFINITIONS = [
  {
    constants: RefinerDaemonConstants,
    Frame: RefinerDaemonFrame,
  },
  {
    constants: ReviewerDaemonConstants,
    Frame: ReviewerDaemonFrame,
  },
  {
    constants: CodifierDaemonConstants,
    Frame: CodifierDaemonFrame,
  },
] as const satisfies readonly IDaemonUiDefinition[];

const DAEMON_FOCUS_ORDER = DAEMON_UI_DEFINITIONS.map(
  (daemonUiDefinition) => daemonUiDefinition.constants.name,
) as readonly TuiDaemonName[];

export { getCodifierFrame, getReviewerFrame };

export function CockpitLaunchpadView({
  shortcutsEnabled = true,
  launchAnimationSize,
  onLaunchAnimationDone,
  launchAnimationRenderer = AnimatedBillboard.trigger,
  refinerGlyphPalette = DEFAULT_RANDOM_GLYPH_COLORS,
  reviewerGlyphPalette = DEFAULT_RANDOM_GLYPH_COLORS,
  codifierGlyphColors = DEFAULT_CODIFIER_GLYPH_COLORS,
  refinerFrameDurationMs = DEFAULT_REFINER_FRAME_DURATION_MS,
  reviewerFrameDurationMs = DEFAULT_REVIEWER_FRAME_DURATION_MS,
  codifierFrameDurationMs = DEFAULT_CODIFIER_FRAME_DURATION_MS,
  settingsReader,
}: CockpitLaunchpadViewProps = {}): React.ReactElement {
  const subprocessManager = useSubprocessManager();
  const [launchAnimationDone, setLaunchAnimationDone] = useState(
    launchAnimationSize === undefined,
  );
  const [reviewerFrameIndex, setReviewerFrameIndex] = useState(0);
  const [refinerFrameIndex, setRefinerFrameIndex] = useState(0);
  const [codifierFrameIndex, setCodifierFrameIndex] = useState(0);
  const [selectedDaemon, setSelectedDaemon] = useState<TuiDaemonName>("refiner");
  const [configuredDaemon, setConfiguredDaemon] = useState<TuiDaemonName | undefined>(undefined);
  const [infoDaemon, setInfoDaemon] = useState<TuiDaemonName | undefined>(undefined);
  const [welcomeVisible, setWelcomeVisible] = useState<boolean | undefined>(
    settingsReader === undefined ? true : undefined,
  );
  const [daemonConfigs, setDaemonConfigs] = useState<TuiDaemonConfigs>(DEFAULT_WORKER_DAEMON_CONFIGS);
  const [daemonStatuses, setDaemonStatuses] = useState<readonly TuiSubprocessSnapshot[]>(
    subprocessManager.getAllStatuses(),
  );
  const [daemonEventRows, setDaemonEventRows] = useState<readonly DaemonEventRow[]>(() =>
    getDaemonEventRows(subprocessManager.getAllStatuses(), Date.now())
  );
  const launchAnimationActive =
    launchAnimationSize !== undefined && !launchAnimationDone;

  useEffect(() => {
    if (launchAnimationSize === undefined) {
      setLaunchAnimationDone(true);
    }
  }, [launchAnimationSize]);

  const handleLaunchAnimationDone = useCallback(() => {
    setLaunchAnimationDone(true);
    onLaunchAnimationDone?.();
  }, [onLaunchAnimationDone]);

  useEffect(() => {
    let mounted = true;

    if (settingsReader === undefined) {
      setWelcomeVisible(true);
      return () => {
        mounted = false;
      };
    }

    setWelcomeVisible(undefined);
    void settingsReader.read()
      .then((settings) => {
        if (mounted) {
          setWelcomeVisible(settings.tui?.showLaunchpadWelcome ?? true);
        }
      })
      .catch(() => {
        if (mounted) {
          setWelcomeVisible(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [settingsReader]);

  const hideWelcome = useCallback(async () => {
    setWelcomeVisible(false);

    if (settingsReader === undefined) {
      return;
    }

    try {
      const settings = await settingsReader.read();
      await settingsReader.write({
        ...settings,
        tui: {
          ...settings.tui,
          showLaunchpadWelcome: false,
        },
      });
    } catch {
      // Keep the in-memory dismissal even if persistence is unavailable.
    }
  }, [settingsReader]);

  useDaemonAnimationFrames({
    reviewerFrameDurationMs,
    refinerFrameDurationMs,
    codifierFrameDurationMs,
    setReviewerFrameIndex,
    setRefinerFrameIndex,
    setCodifierFrameIndex,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const snapshots = subprocessManager.getAllStatuses();
      setDaemonStatuses(snapshots);
      setDaemonEventRows((currentRows) =>
        appendDaemonEventRows(currentRows, getDaemonEventRows(snapshots, Date.now()))
      );
    }, 500);

    return () => clearInterval(timer);
  }, [subprocessManager]);

  useInput(
    (input, key) => {
      if (key.tab || input === "\t") {
        setSelectedDaemon((currentDaemon) => {
          const nextDaemon = getNextFocusedDaemon(
            currentDaemon,
            DAEMON_FOCUS_ORDER,
          );
          setInfoDaemon((currentInfoDaemon) =>
            currentInfoDaemon === undefined ? undefined : nextDaemon
          );
          return nextDaemon;
        });
      }
      if (input === "s" || input === "S") {
        void toggleDaemon(selectedDaemon, subprocessManager, daemonConfigs[selectedDaemon], setDaemonStatuses, setDaemonEventRows);
      }
      if (input === "@") {
        setConfiguredDaemon((currentDaemon) =>
          currentDaemon === selectedDaemon ? undefined : selectedDaemon
        );
      }
      if (input === "i" || input === "I") {
        setInfoDaemon((currentDaemon) =>
          currentDaemon === selectedDaemon ? undefined : selectedDaemon
        );
      }
      if (
        (input === "x" || input === "X") &&
        welcomeVisible === true &&
        configuredDaemon === undefined
      ) {
        void hideWelcome();
        return;
      }
      if (input === "a" || input === "A") {
        if (configuredDaemon !== undefined) {
          setDaemonConfigs((configs) => nextDaemonConfigs(configs, configuredDaemon, nextAgentConfig));
        }
      }
      if (input === "p" || input === "P") {
        if (configuredDaemon !== undefined) {
          setDaemonConfigs((configs) => nextDaemonConfigs(configs, configuredDaemon, nextPollConfig));
        }
      }
      if (input === "x" || input === "X") {
        if (configuredDaemon !== undefined) {
          setDaemonConfigs((configs) => nextDaemonConfigs(configs, configuredDaemon, nextRetryConfig));
        }
      }
    },
    { isActive: shortcutsEnabled },
  );

  const daemonStatusByName = Object.fromEntries(
    DAEMON_UI_DEFINITIONS.map((daemonUiDefinition) => [
      daemonUiDefinition.constants.name,
      findDaemonStatus(daemonStatuses, daemonUiDefinition.constants.name),
    ]),
  ) as Record<TuiDaemonName, TuiSubprocessSnapshot>;
  const daemonFrameIndexByName = {
    refiner: getRenderedFrameIndex(daemonStatusByName.refiner, refinerFrameIndex),
    reviewer: getRenderedFrameIndex(daemonStatusByName.reviewer, reviewerFrameIndex),
    codifier: getRenderedFrameIndex(daemonStatusByName.codifier, codifierFrameIndex),
  } as const satisfies Record<TuiDaemonName, number>;
  const infoDaemonConstants = infoDaemon === undefined
    ? undefined
    : DAEMON_UI_DEFINITIONS.find(
      (definition) => definition.constants.name === infoDaemon,
    )?.constants;

  if (launchAnimationActive) {
    return (
      <Box flexDirection="column" flexGrow={1} width="100%" height="100%">
        {launchAnimationRenderer({
          height: launchAnimationSize.height,
          width: launchAnimationSize.width,
          onDone: handleLaunchAnimationDone,
        })}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%" height="100%" paddingX={1}>
      {welcomeVisible === true && (
        <CockpitLaunchpadWelcome />
      )}
      <Box flexDirection="row" flexShrink={0} height={13} width="100%" gap={1} marginY={1}>
        {DAEMON_UI_DEFINITIONS.map((daemonUiDefinition) => {
          const { constants: daemonConstants, Frame } = daemonUiDefinition;
          const name = daemonConstants.name;
          const snapshot = daemonStatusByName[name];
          const frameIndex = daemonFrameIndexByName[name];
          const statusLabel = getDaemonPanelStatusLabel(
            snapshot,
            daemonConstants,
          );

          return (
          <CockpitDaemonPanel
            key={name}
            daemonConstants={daemonConstants}
            selected={selectedDaemon === name}
            configuring={configuredDaemon === name}
            infoVisible={infoDaemon === name}
            snapshot={snapshot}
            pendingConfig={daemonConfigs[name]}
          >
            <Frame
              frameIndex={frameIndex}
              snapshot={snapshot}
              statusLabel={statusLabel}
              refinerGlyphPalette={refinerGlyphPalette}
              reviewerGlyphPalette={reviewerGlyphPalette}
              codifierGlyphColors={codifierGlyphColors}
            />
          </CockpitDaemonPanel>
          );
        })}
      </Box>
      <Box flexDirection="column" flexGrow={1} flexBasis={0} width="100%" paddingY={1}>
        {infoDaemonConstants !== undefined && (
          <DaemonInfoOverlay daemonConstants={infoDaemonConstants} />
        )}
        <Text color={BaseColors.shade2} bold>
          {CockpitLaunchpadCopy.eventsHeading}
        </Text>
        <Box flexDirection="column" marginTop={1}>
          {daemonEventRows.map((row) => (
            <Text key={row.key} color={row.color}>
              {formatDaemonEventRow(row)}
            </Text>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function useDaemonAnimationFrames({
  reviewerFrameDurationMs,
  refinerFrameDurationMs,
  codifierFrameDurationMs,
  setReviewerFrameIndex,
  setRefinerFrameIndex,
  setCodifierFrameIndex,
}: {
  readonly reviewerFrameDurationMs: number;
  readonly refinerFrameDurationMs: number;
  readonly codifierFrameDurationMs: number;
  readonly setReviewerFrameIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly setRefinerFrameIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly setCodifierFrameIndex: React.Dispatch<React.SetStateAction<number>>;
}): void {
  useEffect(() => {
    if (reviewerFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setReviewerFrameIndex((previousFrameIndex) =>
        (previousFrameIndex + 1) % REVIEWER_FRAME_COUNT
      );
    }, reviewerFrameDurationMs);

    return () => clearInterval(timer);
  }, [reviewerFrameDurationMs, setReviewerFrameIndex]);

  useEffect(() => {
    if (REFINER_FRAME_COUNT <= 1 || refinerFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setRefinerFrameIndex((previousFrameIndex) =>
        (previousFrameIndex + 1) % REFINER_FRAME_COUNT
      );
    }, refinerFrameDurationMs);

    return () => clearInterval(timer);
  }, [refinerFrameDurationMs, setRefinerFrameIndex]);

  useEffect(() => {
    if (codifierFrameDurationMs <= 0) return;

    const timer = setInterval(() => {
      setCodifierFrameIndex((previousFrameIndex) =>
        (previousFrameIndex + 1) % CODIFIER_FRAME_COUNT
      );
    }, codifierFrameDurationMs);

    return () => clearInterval(timer);
  }, [codifierFrameDurationMs, setCodifierFrameIndex]);
}

async function toggleDaemon(
  name: TuiDaemonName,
  manager: ISubprocessManager,
  config: TuiDaemonConfig,
  setDaemonStatuses: (statuses: readonly TuiSubprocessSnapshot[]) => void,
  setDaemonEventRows: (update: (currentRows: readonly DaemonEventRow[]) => readonly DaemonEventRow[]) => void,
): Promise<void> {
  const snapshot = manager.getStatus(name);
  if (snapshot.status === TuiSubprocessStatus.RUNNING) {
    await manager.terminate(name);
  } else {
    await manager.spawn(name, config);
  }
  const snapshots = manager.getAllStatuses();
  setDaemonStatuses(snapshots);
  setDaemonEventRows((currentRows) =>
    appendDaemonEventRows(currentRows, getDaemonEventRows(snapshots, Date.now()))
  );
}
