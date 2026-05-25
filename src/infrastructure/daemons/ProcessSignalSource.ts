import { IShutdownSignal } from "../../application/daemons/IShutdownSignal.js";

export class ProcessSignalSource implements IShutdownSignal {
  private shutdownRequested = false;
  private readonly callbacks: Array<() => void> = [];

  constructor() {
    process.on("SIGINT", () => this.requestShutdown());
    process.on("SIGTERM", () => this.requestShutdown());
  }

  get isShutdownRequested(): boolean {
    return this.shutdownRequested;
  }

  onShutdown(callback: () => void): void {
    this.callbacks.push(callback);
  }

  private requestShutdown(): void {
    if (this.shutdownRequested) {
      return;
    }

    this.shutdownRequested = true;
    for (const callback of this.callbacks) {
      callback();
    }
  }
}
