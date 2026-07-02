import type { DaemonName } from "../daemon-subprocesses/ISubprocessManager.js";
import { CodifierDaemonConstants } from "./daemons/CodifierDaemonConstants.js";
import { CodifierDaemonFrame } from "./daemons/CodifierDaemonFrame.js";
import type { IDaemonUiDefinition } from "./daemons/IDaemonUiDefinition.js";
import { RefinerDaemonConstants } from "./daemons/RefinerDaemonConstants.js";
import { RefinerDaemonFrame } from "./daemons/RefinerDaemonFrame.js";
import { ReviewerDaemonConstants } from "./daemons/ReviewerDaemonConstants.js";
import { ReviewerDaemonFrame } from "./daemons/ReviewerDaemonFrame.js";

const daemonUiDefinitions = [
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

export const CockpitLaunchpadDaemonDefinitions = {
  all: daemonUiDefinitions,
  focusOrder: daemonUiDefinitions.map(
    (daemonUiDefinition) => daemonUiDefinition.constants.name,
  ) as readonly DaemonName[],
} as const;
