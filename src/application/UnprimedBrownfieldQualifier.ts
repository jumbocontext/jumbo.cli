import { ISolutionContextReader } from "./ISolutionContextReader.js";

/**
 * UnprimedBrownfieldQualifier - Determines if a brownfield project needs priming
 *
 * A brownfield project is "unprimed" when it has been added to Jumbo but no
 * solution context has been recorded yet. In this state, LLMs should be prompted
 * to help transfer existing project knowledge into Jumbo.
 *
 * This is the single source of truth for determining "unprimed brownfield" state.
 * To adjust what counts as "primed", modify the isUnprimed() method.
 *
 * Current rule: A project is primed if it has ANY of the following:
 * - Architecture definition
 * - At least one component
 * - At least one decision
 * - At least one invariant
 * - At least one guideline
 */
export class UnprimedBrownfieldQualifier {
  constructor(private readonly solutionContextReader: ISolutionContextReader) {}

  /**
   * Check if the project is in an unprimed brownfield state
   *
   * @returns true if the project needs priming (no solution context exists)
   */
  async isUnprimed(): Promise<boolean> {
    const context = await this.solutionContextReader.getSolutionContext();

    const hasArchitecture = context.architecture !== null;
    const hasComponents = context.components.length > 0;
    const hasDecisions = context.decisions.length > 0;
    const hasInvariants = context.invariants.length > 0;
    const hasGuidelines = context.guidelines.length > 0;

    // Primed if ANY solution context exists
    const isPrimed =
      hasArchitecture ||
      hasComponents ||
      hasDecisions ||
      hasInvariants ||
      hasGuidelines;

    return !isPrimed;
  }
}
