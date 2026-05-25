import { ITicker } from "../../application/daemons/ITicker.js";

export class IntervalTicker implements ITicker {
  constructor(private readonly intervalMs: number) {}

  wait(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.intervalMs);
    });
  }
}
