import React from "react";
import { Box } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";
import type { TuiDaemonConfig, TuiSubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import { DaemonActionLine } from "./DaemonActionLine.js";
import { DaemonConfigWizard } from "./DaemonConfigWizard.js";
import type { IDaemonConstants } from "./daemons/IDaemonConstants.js";

export function CockpitDaemonPanel({
  daemonConstants,
  snapshot,
  pendingConfig,
  selected,
  configuring,
  infoVisible,
  children,
}: {
  readonly daemonConstants: IDaemonConstants;
  readonly snapshot: TuiSubprocessSnapshot;
  readonly pendingConfig: TuiDaemonConfig;
  readonly selected: boolean;
  readonly configuring: boolean;
  readonly infoVisible: boolean;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <Panel
      title={daemonConstants.title}
      titleColor={selected ? BaseColors.brandBlue : BaseColors.shade3}
      borderColor={selected ? BaseColors.brandBlue : BaseColors.shade5}
      flexGrow={3}
      flexBasis={0}
      height="100%"
      bordered={false}
    >
      <Box alignItems="center" flexDirection="column">
        {children}
        <DaemonActionLine
          snapshot={snapshot}
          selected={selected}
          infoVisible={infoVisible}
        />
        {configuring && (
          <DaemonConfigWizard
            snapshot={snapshot}
            pendingConfig={pendingConfig}
            selected={selected}
          />
        )}
      </Box>
    </Panel>
  );
}

