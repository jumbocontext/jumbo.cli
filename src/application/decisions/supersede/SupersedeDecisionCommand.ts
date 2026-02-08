export interface SupersedeDecisionCommand {
  readonly decisionId: string;
  readonly supersededBy: string;
}
