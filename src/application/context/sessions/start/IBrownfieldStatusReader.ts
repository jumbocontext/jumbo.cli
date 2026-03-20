/**
 * IBrownfieldStatusReader - Port for checking if a brownfield project needs priming
 *
 * A brownfield project is "unprimed" when it has been added to Jumbo but no
 * solution context has been recorded yet (no architecture, components,
 * decisions, invariants, or guidelines). In this state, LLMs should be
 * prompted to help transfer existing project knowledge into Jumbo.
 */
export interface IBrownfieldStatusReader {
  /**
   * Check if the project is in an unprimed brownfield state
   *
   * @returns true if the project needs priming (no solution context exists)
   */
  isUnprimed(): Promise<boolean>;
}
