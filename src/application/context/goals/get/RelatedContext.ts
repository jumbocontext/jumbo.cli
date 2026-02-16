/**
 * RelatedContext<T> - Generic wrapper that enriches any entity view with relation metadata.
 *
 * Replaces the five bespoke Related* types (RelatedComponent, RelatedDecision, etc.)
 * with a single reusable generic. The entity view is composed (not extended) to maintain
 * clear separation between entity data and relation metadata.
 *
 * @typeParam T - The entity view type (e.g., ComponentView, DecisionView)
 */
export interface RelatedContext<T> {
  readonly entity: T;
  readonly relationType: string;
  readonly relationDescription: string;
}
