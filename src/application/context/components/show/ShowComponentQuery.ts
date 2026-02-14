/**
 * Query to show a component's details.
 * Supports lookup by either componentId or name.
 */
export interface ShowComponentQuery {
  readonly componentId?: string;
  readonly name?: string;
}
