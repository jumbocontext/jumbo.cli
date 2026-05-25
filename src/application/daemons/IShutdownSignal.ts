export interface IShutdownSignal {
  readonly isShutdownRequested: boolean;
  onShutdown(callback: () => void): void;
}
