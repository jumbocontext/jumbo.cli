export interface RepairStepResult {
  readonly name: string;
  readonly status: "repaired" | "skipped" | "failed";
  readonly detail?: string;
}

export interface RepairResponse {
  readonly steps: RepairStepResult[];
}
