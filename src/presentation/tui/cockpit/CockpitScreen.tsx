import React, { useState, useCallback, useMemo } from "react";
import { Box } from "ink";
import { AnimatedBanner } from "./AnimatedBanner.js";
import { generateCustomInfoBoxLines } from "../../cli/banner/AnimationFrames.js";
import { CockpitGreeterView } from "./CockpitGreeterView.js";
import { CockpitUnprimedView } from "./CockpitUnprimedView.js";
import { CockpitPrimedEmptyView } from "./CockpitPrimedEmptyView.js";
import { CockpitLaunchpadView } from "./CockpitLaunchpadView.js";
import type { LaunchAnimationRenderer } from "./CockpitLaunchpadView.js";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";
import { ProjectLifecycle } from "../../../domain/project/Constants.js";
import { CockpitScreenCopy } from "./CockpitScreenCopy.js";
import { CockpitScreenDefaults } from "./CockpitScreenDefaults.js";

export type CockpitState =
  (typeof ProjectLifecycle)[keyof typeof ProjectLifecycle];

const PLACEHOLDER_COCKPIT_STATE: CockpitState = ProjectLifecycle.UNINITIALIZED;

interface CockpitScreenProps {
  state?: CockpitState;
  shortcutsEnabled?: boolean;
  terminalWidth?: number;
  terminalHeight?: number;
  launchAnimationEnabled?: boolean;
  bannerAnimationComplete?: boolean;
  billboardAnimationComplete?: boolean;
  onBannerAnimationComplete?: () => void;
  onBillboardAnimationComplete?: () => void;
  launchAnimationRenderer?: LaunchAnimationRenderer;
  settingsReader?: Pick<ISettingsReader, "read" | "write">;
}

export function CockpitScreen({
  state = PLACEHOLDER_COCKPIT_STATE,
  shortcutsEnabled = true,
  terminalWidth = CockpitScreenDefaults.terminalWidth,
  terminalHeight = CockpitScreenDefaults.bodyHeight,
  launchAnimationEnabled = true,
  bannerAnimationComplete,
  billboardAnimationComplete = false,
  onBannerAnimationComplete,
  onBillboardAnimationComplete,
  launchAnimationRenderer,
  settingsReader,
}: CockpitScreenProps = {}): React.ReactElement {
  const [localBannerComplete, setLocalBannerComplete] = useState(
    !launchAnimationEnabled,
  );
  const bannerComplete =
    !launchAnimationEnabled ||
    bannerAnimationComplete === true ||
    localBannerComplete;
  const bannerAnimationActive = launchAnimationEnabled && !bannerComplete;
  const billboardAnimationActive =
    launchAnimationEnabled && !billboardAnimationComplete;
  const bannerPersists =
    state === ProjectLifecycle.UNINITIALIZED ||
    state === ProjectLifecycle.UNPRIMED;
  const shouldRenderBanner =
    state !== ProjectLifecycle.PRIMED && (bannerAnimationActive || bannerPersists);
  const shouldRenderContent = state === ProjectLifecycle.PRIMED || bannerComplete;
  const launchAnimationSize = useMemo(
    () => ({
      height: Math.max(1, Math.floor(terminalHeight)),
      width: Math.max(1, Math.floor(terminalWidth)),
    }),
    [terminalHeight, terminalWidth],
  );

  const handleBannerComplete = useCallback(() => {
    setLocalBannerComplete(true);
    onBannerAnimationComplete?.();
  }, [onBannerAnimationComplete]);

  const infoBoxLines = useMemo(() => {
    if (state === ProjectLifecycle.UNINITIALIZED) {
      return generateCustomInfoBoxLines([
        { label: CockpitScreenCopy.directoryLabel, value: process.cwd() },
        {
          label: CockpitScreenCopy.statusLabel,
          value: CockpitScreenCopy.uninitializedStatus,
        },
      ]);
    }
    if (state === ProjectLifecycle.UNPRIMED) {
      return generateCustomInfoBoxLines([
        { label: CockpitScreenCopy.directoryLabel, value: process.cwd() },
        { label: CockpitScreenCopy.statusLabel, value: CockpitScreenCopy.readyStatus },
      ]);
    }
    return undefined;
  }, [state]);

  return (
    <Box flexDirection="column" flexGrow={1} width="100%">
      {shouldRenderBanner && (
        <Box alignSelf="center" marginTop={1} flexShrink={0}>
          <AnimatedBanner
            onComplete={handleBannerComplete}
            persist={bannerPersists}
            version={CockpitScreenDefaults.placeholderVersion}
            infoBoxLines={infoBoxLines}
            animated={bannerAnimationActive}
          />
        </Box>
      )}
      {shouldRenderContent && (
        <Box flexDirection="column" flexGrow={1} width="100%">
          {state === ProjectLifecycle.UNINITIALIZED && <CockpitGreeterView />}
          {state === ProjectLifecycle.UNPRIMED && <CockpitUnprimedView />}
          {state === ProjectLifecycle.PRIMED_EMPTY && <CockpitPrimedEmptyView />}
          {state === ProjectLifecycle.PRIMED && (
            <CockpitLaunchpadView
              shortcutsEnabled={shortcutsEnabled}
              launchAnimationSize={
                billboardAnimationActive ? launchAnimationSize : undefined
              }
              onLaunchAnimationDone={onBillboardAnimationComplete}
              launchAnimationRenderer={launchAnimationRenderer}
              settingsReader={settingsReader}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
