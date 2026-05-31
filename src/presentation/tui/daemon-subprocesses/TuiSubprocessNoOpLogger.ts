import type { ILogger } from "../../../application/logging/ILogger.js";

export const TuiSubprocessNoOpLogger: ILogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};
