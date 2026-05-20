import React, { useState, useCallback, useMemo } from "react";
import { Box } from "ink";
import { AnimatedBanner } from "./AnimatedBanner.js";
import { generateCustomInfoBoxLines } from "../../cli/banner/AnimationFrames.js";
import { CockpitGreeterView } from "./CockpitGreeterView.js";
import { CockpitUnprimedView } from "./CockpitUnprimedView.js";
import { CockpitPrimedEmptyView } from "./CockpitPrimedEmptyView.js";
import { CockpitLaunchpadView } from "./CockpitLaunchpadView.js";

export type CockpitState =
  | "uninitialized"
  | "unprimed"
  | "primed-empty"
  | "primed";

const PLACEHOLDER_COCKPIT_STATE: CockpitState = "uninitialized";
const PLACEHOLDER_VERSION = "0.0.0";

interface CockpitScreenProps {
  state?: CockpitState;
  shortcutsEnabled?: boolean;
}

export function CockpitScreen({
  state = PLACEHOLDER_COCKPIT_STATE,
  shortcutsEnabled = true,
}: CockpitScreenProps = {}): React.ReactElement {
  const [bannerComplete, setBannerComplete] = useState(false);
  const showBanner = state === "uninitialized" || state === "unprimed";

  const handleBannerComplete = useCallback(() => {
    setBannerComplete(true);
  }, []);

  const infoBoxLines = useMemo(() => {
    if (state === "uninitialized") {
      return generateCustomInfoBoxLines([
        { label: "Directory", value: process.cwd() },
        { label: "Status", value: "Uninitialized" },
      ]);
    }
    if (state === "unprimed") {
      return generateCustomInfoBoxLines([
        { label: "Directory", value: process.cwd() },
        { label: "Status", value: "Ready" },
      ]);
    }
    return undefined;
  }, [state]);

  return (
    <Box flexDirection="column" flexGrow={1} width="100%">
      {(!bannerComplete || showBanner) && (
        <Box alignSelf="center" marginTop={1} flexShrink={0}>
          <AnimatedBanner
            onComplete={handleBannerComplete}
            persist={showBanner}
            version={PLACEHOLDER_VERSION}
            infoBoxLines={infoBoxLines}
          />
        </Box>
      )}
      {bannerComplete && (
        <Box flexDirection="column" flexGrow={1} width="100%">
          {state === "uninitialized" && <CockpitGreeterView />}
          {state === "unprimed" && <CockpitUnprimedView />}
          {state === "primed-empty" && <CockpitPrimedEmptyView />}
          {state === "primed" && (
            <CockpitLaunchpadView shortcutsEnabled={shortcutsEnabled} />
          )}
        </Box>
      )}
    </Box>
  );
}
