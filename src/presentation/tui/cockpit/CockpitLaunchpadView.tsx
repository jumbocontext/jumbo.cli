import React, { useCallback, useEffect, useState } from "react";
import { Box, useInput } from "ink";
import { DEFAULT_WORKER_DAEMON_CONFIGS } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";
import AnimatedBillboard from "../billboard/AnimatedBillboard.js";
import type { AnimatedBillboardTriggerInput } from "../billboard/AnimatedBillboard.js";
import type {
  DaemonConfigs,
  DaemonName,
  SubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { useSubprocessManager } from "../daemon-subprocesses/useSubprocessManager.js";
import { CockpitDaemonEvents } from "./CockpitDaemonEvents.js";
import { getNextCockpitDaemonAgentConfig } from "./CockpitDaemonAgentConfigCycler.js";
import { updateSelectedCockpitDaemonConfig } from "./CockpitDaemonConfigsUpdater.js";
import { getNextFocusedCockpitDaemon } from "./CockpitDaemonFocusOrder.js";
import { getNextCockpitDaemonPollConfig } from "./CockpitDaemonPollConfigCycler.js";
import { getNextCockpitDaemonRetryConfig } from "./CockpitDaemonRetryConfigCycler.js";
import {
  DEFAULT_CODIFIER_FRAME_DURATION_MS,
  DEFAULT_CODIFIER_GLYPH_COLORS,
  DEFAULT_RANDOM_GLYPH_COLORS,
  DEFAULT_REFINER_FRAME_DURATION_MS,
  DEFAULT_REVIEWER_FRAME_DURATION_MS,
  getRenderedFrameIndex,
  type GlyphColorMap,
  type GlyphPalette,
} from "./CockpitDaemonFrames.js";
import { CockpitLaunchpadDaemonDefinitions } from "./CockpitLaunchpadDaemonDefinitions.js";
import { CockpitLaunchpadDaemonPanels } from "./CockpitLaunchpadDaemonPanels.js";
import { CockpitLaunchpadEventLog } from "./CockpitLaunchpadEventLog.js";
import { CockpitLaunchpadWelcome } from "./CockpitLaunchpadWelcome.js";
import { CockpitProjectStatsPanel } from "./CockpitProjectStatsPanel.js";
import { DaemonInfoOverlay } from "./DaemonInfoOverlay.js";
import { toggleCockpitDaemon } from "./toggleCockpitDaemon.js";
import { useCockpitLaunchpadWelcomeVisibility } from "./useCockpitLaunchpadWelcomeVisibility.js";
import { useDaemonAnimationFrames } from "./useDaemonAnimationFrames.js";
import { useDaemonStatusPolling } from "./useDaemonStatusPolling.js";
import { BaseColors } from "../../shared/DesignTokens.js";
import { HorizontalRule } from "../ui-primitives/HorizontalRule.js";

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
  const [selectedDaemon, setSelectedDaemon] = useState<DaemonName>("refiner");
  const [configuredDaemon, setConfiguredDaemon] = useState<
    DaemonName | undefined
  >(undefined);
  const [infoDaemon, setInfoDaemon] = useState<DaemonName | undefined>(
    undefined,
  );
  const [daemonConfigs, setDaemonConfigs] = useState<DaemonConfigs>(
    DEFAULT_WORKER_DAEMON_CONFIGS,
  );
  const { welcomeVisible, hideWelcome } =
    useCockpitLaunchpadWelcomeVisibility(settingsReader);
  const {
    daemonStatuses,
    daemonEventRows,
    setDaemonStatuses,
    setDaemonEventRows,
  } = useDaemonStatusPolling(subprocessManager);
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

  useDaemonAnimationFrames({
    reviewerFrameDurationMs,
    refinerFrameDurationMs,
    codifierFrameDurationMs,
    setReviewerFrameIndex,
    setRefinerFrameIndex,
    setCodifierFrameIndex,
  });

  useInput(
    (input, key) => {
      if (key.tab || input === "\t") {
        setSelectedDaemon((currentDaemon) => {
          const nextDaemon = getNextFocusedCockpitDaemon(
            currentDaemon,
            CockpitLaunchpadDaemonDefinitions.focusOrder,
          );
          setInfoDaemon((currentInfoDaemon) =>
            currentInfoDaemon === undefined ? undefined : nextDaemon
          );
          return nextDaemon;
        });
      }
      if (input === "s" || input === "S") {
        void toggleCockpitDaemon(
          selectedDaemon,
          subprocessManager,
          daemonConfigs[selectedDaemon],
          setDaemonStatuses,
          setDaemonEventRows,
        );
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
          setDaemonConfigs((configs) =>
            updateSelectedCockpitDaemonConfig(
              configs,
              configuredDaemon,
              getNextCockpitDaemonAgentConfig,
            )
          );
        }
      }
      if (input === "p" || input === "P") {
        if (configuredDaemon !== undefined) {
          setDaemonConfigs((configs) =>
            updateSelectedCockpitDaemonConfig(
              configs,
              configuredDaemon,
              getNextCockpitDaemonPollConfig,
            )
          );
        }
      }
      if (input === "x" || input === "X") {
        if (configuredDaemon !== undefined) {
          setDaemonConfigs((configs) =>
            updateSelectedCockpitDaemonConfig(
              configs,
              configuredDaemon,
              getNextCockpitDaemonRetryConfig,
            )
          );
        }
      }
    },
    { isActive: shortcutsEnabled },
  );

  const daemonStatusByName = Object.fromEntries(
    CockpitLaunchpadDaemonDefinitions.all.map((daemonUiDefinition) => [
      daemonUiDefinition.constants.name,
      CockpitDaemonEvents.findStatus(
        daemonStatuses,
        daemonUiDefinition.constants.name,
      ),
    ]),
  ) as Record<DaemonName, SubprocessSnapshot>;
  const daemonFrameIndexByName = {
    refiner: getRenderedFrameIndex(
      daemonStatusByName.refiner,
      refinerFrameIndex,
    ),
    reviewer: getRenderedFrameIndex(
      daemonStatusByName.reviewer,
      reviewerFrameIndex,
    ),
    codifier: getRenderedFrameIndex(
      daemonStatusByName.codifier,
      codifierFrameIndex,
    ),
  } as const satisfies Record<DaemonName, number>;
  const infoDaemonConstants =
    infoDaemon === undefined
      ? undefined
      : CockpitLaunchpadDaemonDefinitions.all.find(
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
      <HorizontalRule color={BaseColors.shade6} />
      {welcomeVisible === true && <CockpitLaunchpadWelcome />}
      <CockpitProjectStatsPanel />
      <CockpitLaunchpadDaemonPanels
        selectedDaemon={selectedDaemon}
        configuredDaemon={configuredDaemon}
        infoDaemon={infoDaemon}
        daemonStatuses={daemonStatuses}
        daemonConfigs={daemonConfigs}
        daemonFrameIndexByName={daemonFrameIndexByName}
        refinerGlyphPalette={refinerGlyphPalette}
        reviewerGlyphPalette={reviewerGlyphPalette}
        codifierGlyphColors={codifierGlyphColors}
      />
      <Box flexDirection="column" flexGrow={1} flexBasis={0} width="100%" paddingY={1}>
        {infoDaemonConstants !== undefined && (
          <DaemonInfoOverlay daemonConstants={infoDaemonConstants} />
        )}
        <CockpitLaunchpadEventLog rows={daemonEventRows} />
      </Box>
    </Box>
  );
}
