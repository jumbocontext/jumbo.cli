import { IProcessManager, ProcessManagerOptions } from "./IProcessManager.js";
import { IShutdownSignal } from "./IShutdownSignal.js";
import { ITicker } from "./ITicker.js";

export interface PollingLoopOptions {
  readonly processManager: IProcessManager;
  readonly processOptions: ProcessManagerOptions;
  readonly ticker: ITicker;
  readonly shutdownSignal: IShutdownSignal;
}

export class PollingLoop {
  async run(options: PollingLoopOptions): Promise<void> {
    let stopped = options.shutdownSignal.isShutdownRequested;

    options.shutdownSignal.onShutdown(() => {
      stopped = true;
    });

    while (!stopped) {
      await options.processManager.processNext(options.processOptions);

      if (!stopped) {
        await options.ticker.wait();
      }
    }
  }
}
