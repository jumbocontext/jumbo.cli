export interface EvolveStepResult {
  readonly name: string;
  readonly status: "repaired" | "skipped" | "failed";
  readonly detail?: string;
}
