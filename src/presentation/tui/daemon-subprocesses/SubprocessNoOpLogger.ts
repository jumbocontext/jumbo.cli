import type { ILogger } from "../../../application/logging/ILogger.js";

export const SubprocessNoOpLogger: ILogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};
