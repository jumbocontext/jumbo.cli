/**
 * Port interface for reading goal projections.
 * Used to quickly check goal existence before command execution.
 */
export interface IGoalReader {
  findById(goalId: string): Promise<{ goalId: string; status: string } | null>;
}
