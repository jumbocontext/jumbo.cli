import React, { useState, useCallback } from "react";
import { Box } from "ink";
import { AnimatedBanner } from "../components/AnimatedBanner.js";
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
}

export function CockpitScreen({
  state = PLACEHOLDER_COCKPIT_STATE,
}: CockpitScreenProps = {}): React.ReactElement {
  const [bannerComplete, setBannerComplete] = useState(false);
  const showBanner = state === "uninitialized" || state === "unprimed";

  const handleBannerComplete = useCallback(() => {
    setBannerComplete(true);
  }, []);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {(!bannerComplete || showBanner) && (
        <AnimatedBanner
          onComplete={handleBannerComplete}
          persist={showBanner}
          version={PLACEHOLDER_VERSION}
        />
      )}
      {bannerComplete && (
        <Box flexDirection="column" flexGrow={1}>
          {state === "uninitialized" && <CockpitGreeterView />}
          {state === "unprimed" && <CockpitUnprimedView />}
          {state === "primed-empty" && <CockpitPrimedEmptyView />}
          {state === "primed" && <CockpitLaunchpadView />}
        </Box>
      )}
    </Box>
  );
}
