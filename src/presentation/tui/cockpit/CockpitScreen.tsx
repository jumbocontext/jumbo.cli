import React, { useState, useCallback, useMemo } from "react";
import { Box } from "ink";
import type { LaunchAnimationRenderer } from "./CockpitLaunchpadView.js";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";
import { ProjectLifecycle } from "../../../domain/project/Constants.js";
import { CockpitScreenDefaults } from "./CockpitScreenDefaults.js";
import { CockpitScreenBanner } from "./CockpitScreenBanner.js";
import { CockpitScreenContent } from "./CockpitScreenContent.js";
import { getCockpitLaunchAnimationSize } from "./CockpitLaunchAnimationSize.js";
import {
  CockpitPlaceholderState,
  type CockpitState,
} from "./CockpitState.js";

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
  state = CockpitPlaceholderState,
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
    () => getCockpitLaunchAnimationSize(terminalWidth, terminalHeight),
    [terminalHeight, terminalWidth],
  );

  const handleBannerComplete = useCallback(() => {
    setLocalBannerComplete(true);
    onBannerAnimationComplete?.();
  }, [onBannerAnimationComplete]);

  return (
    <Box flexDirection="column" flexGrow={1} width="100%">
      <CockpitScreenBanner
        state={state}
        shouldRenderBanner={shouldRenderBanner}
        bannerAnimationActive={bannerAnimationActive}
        bannerPersists={bannerPersists}
        onBannerAnimationComplete={handleBannerComplete}
      />
      <CockpitScreenContent
        state={state}
        shortcutsEnabled={shortcutsEnabled}
        shouldRenderContent={shouldRenderContent}
        launchAnimationSize={
          billboardAnimationActive ? launchAnimationSize : undefined
        }
        onBillboardAnimationComplete={onBillboardAnimationComplete}
        launchAnimationRenderer={launchAnimationRenderer}
        settingsReader={settingsReader}
      />
    </Box>
  );
}
