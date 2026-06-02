import { DaemonEventRowFormatter } from "./DaemonEventRowFormatter.js";
import { DaemonEventRows } from "./DaemonEventRows.js";
import { DaemonStatusFinder } from "./DaemonStatusFinder.js";

export const CockpitDaemonEvents = {
  appendRows: DaemonEventRows.append,
  findStatus: DaemonStatusFinder.find,
  formatRow: DaemonEventRowFormatter.format,
  getRows: DaemonEventRows.fromSnapshots,
} as const;
