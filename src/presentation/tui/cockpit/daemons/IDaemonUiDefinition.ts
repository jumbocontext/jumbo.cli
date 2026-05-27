import type { IDaemonFrame } from "./IDaemonFrame.js";
import type { IDaemonConstants } from "./IDaemonConstants.js";

export interface IDaemonUiDefinition {
  readonly constants: IDaemonConstants;
  readonly Frame: (frame: IDaemonFrame) => React.ReactElement;
}
