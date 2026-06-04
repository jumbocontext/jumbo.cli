import React from "react";
import { Box } from "ink";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";
import { ProjectLifecycle } from "../../../domain/project/Constants.js";
import {
  CockpitLaunchpadView,
  type LaunchAnimationRenderer,
} from "./CockpitLaunchpadView.js";
import type { CockpitLaunchAnimationSize } from "./CockpitLaunchAnimationSize.js";
import { CockpitGreeterView } from "./CockpitGreeterView.js";
import { CockpitPrimedEmptyView } from "./CockpitPrimedEmptyView.js";
import type { CockpitState } from "./CockpitState.js";
import { CockpitUnprimedView } from "./CockpitUnprimedView.js";

interface CockpitScreenContentProps {
  readonly state: CockpitState;
  readonly shortcutsEnabled: boolean;
  readonly shouldRenderContent: boolean;
  readonly launchAnimationSize?: CockpitLaunchAnimationSize;
  readonly onBillboardAnimationComplete?: () => void;
  readonly launchAnimationRenderer?: LaunchAnimationRenderer;
  readonly settingsReader?: Pick<ISettingsReader, "read" | "write">;
}

export function CockpitScreenContent({
  state,
  shortcutsEnabled,
  shouldRenderContent,
  launchAnimationSize,
  onBillboardAnimationComplete,
  launchAnimationRenderer,
  settingsReader,
}: CockpitScreenContentProps): React.ReactElement | null {
  if (!shouldRenderContent) {
    return null;
  }

  return (
    <Box flexDirection="column" flexGrow={1} width="100%">
      {state === ProjectLifecycle.UNINITIALIZED && <CockpitGreeterView />}
      {state === ProjectLifecycle.UNPRIMED && <CockpitUnprimedView />}
      {state === ProjectLifecycle.PRIMED_EMPTY && <CockpitPrimedEmptyView />}
      {state === ProjectLifecycle.PRIMED && (
        <CockpitLaunchpadView
          shortcutsEnabled={shortcutsEnabled}
          launchAnimationSize={launchAnimationSize}
          onLaunchAnimationDone={onBillboardAnimationComplete}
          launchAnimationRenderer={launchAnimationRenderer}
          settingsReader={settingsReader}
        />
      )}
    </Box>
  );
}
