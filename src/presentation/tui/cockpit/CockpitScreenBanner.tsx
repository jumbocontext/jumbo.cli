import React, { useMemo } from "react";
import { Box } from "ink";
import { AnimatedBanner } from "./AnimatedBanner.js";
import { CockpitScreenDefaults } from "./CockpitScreenDefaults.js";
import { getCockpitScreenInfoBoxLines } from "./CockpitScreenInfoBoxLines.js";
import type { CockpitState } from "./CockpitState.js";

interface CockpitScreenBannerProps {
  readonly state: CockpitState;
  readonly shouldRenderBanner: boolean;
  readonly bannerAnimationActive: boolean;
  readonly bannerPersists: boolean;
  readonly onBannerAnimationComplete: () => void;
}

export function CockpitScreenBanner({
  state,
  shouldRenderBanner,
  bannerAnimationActive,
  bannerPersists,
  onBannerAnimationComplete,
}: CockpitScreenBannerProps): React.ReactElement | null {
  const infoBoxLines = useMemo(
    () => getCockpitScreenInfoBoxLines(state),
    [state],
  );

  if (!shouldRenderBanner) {
    return null;
  }

  return (
    <Box alignSelf="center" marginTop={1} flexShrink={0}>
      <AnimatedBanner
        onComplete={onBannerAnimationComplete}
        persist={bannerPersists}
        version={CockpitScreenDefaults.placeholderVersion}
        infoBoxLines={infoBoxLines}
        animated={bannerAnimationActive}
      />
    </Box>
  );
}
