export interface ProjectStatsSnapshotView {
  readonly project: ProjectStatsView;
  readonly work: WorkStatsView;
  readonly memory: MemoryStatsView;
  readonly graph: GraphStatsView;
}

export interface ProjectStatsView {
  readonly audiences: AudienceStatsView;
  readonly audiencePains: AudiencePainStatsView;
  readonly valuePropositions: ValuePropositionsStatsView;
}

export interface AudienceStatsView {
  readonly totalAudiences: TotalAudiences;
  readonly primaryAudiences: PrimaryAudiences;
  readonly secondaryAudiences: SecondaryAudiences;
}

export interface AudiencePainStatsView {
  readonly audiencePainsCount: AudiencePainsCount;
}

export interface ValuePropositionsStatsView {
  readonly valuePropositionsCount: ValuePropositionsCount;
}

export interface WorkStatsView {
  readonly goals: GoalStatsView;
  readonly sessions: SessionsStatsView;
}

export interface GoalStatsView {
  readonly definedGoalsCount: DefinedGoalsCount;
  readonly refinedGoalsCount: RefinedGoalsCount;
  readonly inProgressGoalsCount: InProgressGoalsCount;
  readonly submittedGoalsCount: SubmittedGoalsCount;
  readonly closedGoalsCount: ClosedGoalsCount;
}

export interface SessionsStatsView {
  readonly sessionsCount: SessionsCount;
}

export interface MemoryStatsView {
  readonly decisions: DecisionStatsView;
  readonly components: ComponentStatsView;
  readonly dependencies: DependencyStatsView;
  readonly invariants: InvariantStatsView;
  readonly guidelines: GuidelineStatsView;
}

export interface DecisionStatsView {
  readonly decisionsCount: DecisionsCount;
}

export interface ComponentStatsView {
  readonly componentsCount: ComponentsCount;
}

export interface DependencyStatsView {
  readonly dependenciesCount: DependenciesCount;
}

export interface InvariantStatsView {
  readonly invariantsCount: InvariantsCount;
}

export interface GuidelineStatsView {
  readonly guidelinesCount: GuidelinesCount;
}

export interface GraphStatsView {
  readonly relationCount: RelationCount;
}

export type TotalAudiences = number;
export type PrimaryAudiences = number;
export type SecondaryAudiences = number;
export type AudiencePainsCount = number;
export type ValuePropositionsCount = number;
export type DefinedGoalsCount = number;
export type RefinedGoalsCount = number;
export type InProgressGoalsCount = number;
export type SubmittedGoalsCount = number;
export type ClosedGoalsCount = number;
export type SessionsCount = number;
export type DecisionsCount = number;
export type ComponentsCount = number;
export type DependenciesCount = number;
export type InvariantsCount = number;
export type GuidelinesCount = number;
export type RelationCount = number;
