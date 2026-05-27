export interface IDaemonConstants {
  readonly name: string;
  readonly title: string;
  readonly activeVerb: string;
  readonly idleVerb: string;
  readonly info: {
    readonly title: string;
    readonly lines: readonly string[];
  };
}
