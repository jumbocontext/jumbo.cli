/**
 * IWorkerModeAccessor - Application port for reading and writing worker mode.
 *
 * Provides access to the current worker's operating mode.
 * This port is implemented by infrastructure and consumed by
 * application layer services that need to read or update worker mode.
 */

import { WorkerMode } from "./WorkerMode.js";

export interface IWorkerModeAccessor {
  /**
   * Gets the current mode of the worker.
   *
   * @returns The current WorkerMode, or null if no mode is set
   */
  getMode(): WorkerMode;

  /**
   * Sets the operating mode of the current worker.
   *
   * @param mode - The WorkerMode to set
   */
  setMode(mode: WorkerMode): void;
}
