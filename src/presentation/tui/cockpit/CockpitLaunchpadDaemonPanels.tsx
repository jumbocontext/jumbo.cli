import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import type { GlyphColorMap, GlyphPalette } from "./CockpitDaemonFrames.js";
import { CockpitDaemonEvents } from "./CockpitDaemonEvents.js";
import { CockpitDaemonPanel } from "./CockpitDaemonPanel.js";
import { getDaemonPanelStatusLabel } from "./DaemonPanelStatusLabel.js";
import { CockpitLaunchpadDaemonDefinitions } from "./CockpitLaunchpadDaemonDefinitions.js";
import type {
  TuiDaemonConfigs,
  TuiDaemonName,
  TuiSubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { HorizontalRule } from "../ui-primitives/HorizontalRule.js";

interface CockpitLaunchpadDaemonPanelsProps {
  readonly selectedDaemon: TuiDaemonName;
  readonly configuredDaemon: TuiDaemonName | undefined;
  readonly infoDaemon: TuiDaemonName | undefined;
  readonly daemonStatuses: readonly TuiSubprocessSnapshot[];
  readonly daemonConfigs: TuiDaemonConfigs;
  readonly daemonFrameIndexByName: Record<TuiDaemonName, number>;
  readonly refinerGlyphPalette: GlyphPalette;
  readonly reviewerGlyphPalette: GlyphPalette;
  readonly codifierGlyphColors: GlyphColorMap;
}

export function CockpitLaunchpadDaemonPanels({
  selectedDaemon,
  configuredDaemon,
  infoDaemon,
  daemonStatuses,
  daemonConfigs,
  daemonFrameIndexByName,
  refinerGlyphPalette,
  reviewerGlyphPalette,
  codifierGlyphColors,
}: CockpitLaunchpadDaemonPanelsProps): React.ReactElement {
  return (
    <Box width="100%" flexDirection="column">
      <Box flexDirection="row" flexShrink={0} height={13} width="100%" gap={1} marginY={1}>
        {CockpitLaunchpadDaemonDefinitions.all.map((daemonUiDefinition) => {
          const { constants: daemonConstants, Frame } = daemonUiDefinition;
          const name = daemonConstants.name;
          const snapshot = CockpitDaemonEvents.findStatus(daemonStatuses, name);
          const statusLabel = getDaemonPanelStatusLabel(snapshot, daemonConstants);

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
                frameIndex={daemonFrameIndexByName[name]}
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
    </Box>
  );
}
