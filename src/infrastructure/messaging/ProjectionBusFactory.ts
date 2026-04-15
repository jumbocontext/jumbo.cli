/**
 * Factory that creates an event bus wired with projection-only handlers.
 *
 * Used during database rebuild to replay events through pure projectors
 * without triggering side effects (cascades, maintenance goals, command
 * handlers). Side-effect events are already persisted in the event store
 * from original execution and are replayed as regular projection events.
 *
 * Each projector performs a single synchronous SQLite write with no
 * cross-aggregate reads, so parallel execution via InProcessEventBus
 * is safe.
 */

import Database from "better-sqlite3";
import { IEventBus } from "../../application/messaging/IEventBus.js";
import { IEventHandler } from "../../application/messaging/IEventHandler.js";
import { BaseEvent } from "../../domain/BaseEvent.js";
import { InProcessEventBus } from "./InProcessEventBus.js";

// Session projectors
import { SqliteSessionStartedProjector } from "../context/sessions/start/SqliteSessionStartedProjector.js";
import { SqliteSessionEndedProjector } from "../context/sessions/end/SqliteSessionEndedProjector.js";

// Goal projectors
import { SqliteGoalAddedProjector } from "../context/goals/add/SqliteGoalAddedProjector.js";
import { SqliteGoalStartedProjector } from "../context/goals/start/SqliteGoalStartedProjector.js";
import { SqliteGoalUpdatedProjector } from "../context/goals/update/SqliteGoalUpdatedProjector.js";
import { SqliteGoalBlockedProjector } from "../context/goals/block/SqliteGoalBlockedProjector.js";
import { SqliteGoalUnblockedProjector } from "../context/goals/unblock/SqliteGoalUnblockedProjector.js";
import { SqliteGoalPausedProjector } from "../context/goals/pause/SqliteGoalPausedProjector.js";
import { SqliteGoalResumedProjector } from "../context/goals/resume/SqliteGoalResumedProjector.js";
import { SqliteGoalCompletedProjector } from "../context/goals/complete/SqliteGoalCompletedProjector.js";
import { SqliteGoalRefinedProjector } from "../context/goals/refine/SqliteGoalRefinedProjector.js";
import { SqliteGoalResetProjector } from "../context/goals/reset/SqliteGoalResetProjector.js";
import { SqliteGoalRemovedProjector } from "../context/goals/remove/SqliteGoalRemovedProjector.js";
import { SqliteGoalProgressUpdatedProjector } from "../context/goals/update-progress/SqliteGoalProgressUpdatedProjector.js";
import { SqliteGoalSubmittedForReviewProjector } from "../context/goals/review/SqliteGoalSubmittedForReviewProjector.js";
import { SqliteGoalQualifiedProjector } from "../context/goals/qualify/SqliteGoalQualifiedProjector.js";
import { SqliteGoalCommittedProjector } from "../context/goals/commit/SqliteGoalCommittedProjector.js";
import { SqliteGoalRejectedProjector } from "../context/goals/reject/SqliteGoalRejectedProjector.js";
import { SqliteGoalSubmittedProjector } from "../context/goals/submit/SqliteGoalSubmittedProjector.js";
import { SqliteGoalCodifyingStartedProjector } from "../context/goals/codify/SqliteGoalCodifyingStartedProjector.js";
import { SqliteGoalClosedProjector } from "../context/goals/close/SqliteGoalClosedProjector.js";
import { SqliteGoalApprovedProjector } from "../context/goals/approve/SqliteGoalApprovedProjector.js";
import { SqliteGoalStatusMigratedProjector } from "../context/goals/migrate/SqliteGoalStatusMigratedProjector.js";

// Architecture projectors
import { SqliteArchitectureDefinedProjector } from "../context/architecture/define/SqliteArchitectureDefinedProjector.js";
import { SqliteArchitectureUpdatedProjector } from "../context/architecture/update/SqliteArchitectureUpdatedProjector.js";
import { SqliteArchitectureDeprecatedProjector } from "../context/architecture/deprecate/SqliteArchitectureDeprecatedProjector.js";

// Component projectors
import { SqliteComponentAddedProjector } from "../context/components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../context/components/update/SqliteComponentUpdatedProjector.js";
import { SqliteComponentDeprecatedProjector } from "../context/components/deprecate/SqliteComponentDeprecatedProjector.js";
import { SqliteComponentUndeprecatedProjector } from "../context/components/undeprecate/SqliteComponentUndeprecatedProjector.js";
import { SqliteComponentRemovedProjector } from "../context/components/remove/SqliteComponentRemovedProjector.js";
import { SqliteComponentRenamedProjector } from "../context/components/rename/SqliteComponentRenamedProjector.js";

// Dependency projectors
import { SqliteDependencyAddedProjector } from "../context/dependencies/add/SqliteDependencyAddedProjector.js";
import { SqliteDependencyUpdatedProjector } from "../context/dependencies/update/SqliteDependencyUpdatedProjector.js";
import { SqliteDependencyRemovedProjector } from "../context/dependencies/remove/SqliteDependencyRemovedProjector.js";

// Decision projectors
import { SqliteDecisionAddedProjector } from "../context/decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionUpdatedProjector } from "../context/decisions/update/SqliteDecisionUpdatedProjector.js";
import { SqliteDecisionReversedProjector } from "../context/decisions/reverse/SqliteDecisionReversedProjector.js";
import { SqliteDecisionRestoredProjector } from "../context/decisions/restore/SqliteDecisionRestoredProjector.js";
import { SqliteDecisionSupersededProjector } from "../context/decisions/supersede/SqliteDecisionSupersededProjector.js";

// Guideline projectors
import { SqliteGuidelineAddedProjector } from "../context/guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../context/guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../context/guidelines/remove/SqliteGuidelineRemovedProjector.js";

// Invariant projectors
import { SqliteInvariantAddedProjector } from "../context/invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../context/invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../context/invariants/remove/SqliteInvariantRemovedProjector.js";

// Project projectors
import { SqliteProjectInitializedProjector } from "../context/project/init/SqliteProjectInitializedProjector.js";
import { SqliteProjectUpdatedProjector } from "../context/project/update/SqliteProjectUpdatedProjector.js";

// Audience pain projectors
import { SqliteAudiencePainAddedProjector } from "../context/audience-pains/add/SqliteAudiencePainAddedProjector.js";
import { SqliteAudiencePainUpdatedProjector } from "../context/audience-pains/update/SqliteAudiencePainUpdatedProjector.js";

// Audience projectors
import { SqliteAudienceAddedProjector } from "../context/audiences/add/SqliteAudienceAddedProjector.js";
import { SqliteAudienceUpdatedProjector } from "../context/audiences/update/SqliteAudienceUpdatedProjector.js";
import { SqliteAudienceRemovedProjector } from "../context/audiences/remove/SqliteAudienceRemovedProjector.js";

// Value proposition projectors
import { SqliteValuePropositionAddedProjector } from "../context/value-propositions/add/SqliteValuePropositionAddedProjector.js";
import { SqliteValuePropositionUpdatedProjector } from "../context/value-propositions/update/SqliteValuePropositionUpdatedProjector.js";
import { SqliteValuePropositionRemovedProjector } from "../context/value-propositions/remove/SqliteValuePropositionRemovedProjector.js";

// Relation projectors
import { SqliteRelationAddedProjector } from "../context/relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationDeactivatedProjector } from "../context/relations/deactivate/SqliteRelationDeactivatedProjector.js";
import { SqliteRelationReactivatedProjector } from "../context/relations/reactivate/SqliteRelationReactivatedProjector.js";
import { SqliteRelationRemovedProjector } from "../context/relations/remove/SqliteRelationRemovedProjector.js";

// Worker identity projectors
import { SqliteWorkerIdentifiedProjector } from "../host/workers/identify/SqliteWorkerIdentifiedProjector.js";

export class ProjectionBusFactory {

  /**
   * Creates an event bus with projection-only handlers for the given database.
   */
  create(db: Database.Database): IEventBus {
    const bus = new InProcessEventBus();

    // Session projections
    const sessionStartedProjector = new SqliteSessionStartedProjector(db);
    const sessionEndedProjector = new SqliteSessionEndedProjector(db);
    bus.subscribe("SessionStartedEvent", this.wrap((e) => sessionStartedProjector.applySessionStarted(e as any)));
    bus.subscribe("SessionEndedEvent", this.wrap((e) => sessionEndedProjector.applySessionEnded(e as any)));

    // Goal projections
    const goalAddedProjector = new SqliteGoalAddedProjector(db);
    const goalStartedProjector = new SqliteGoalStartedProjector(db);
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(db);
    const goalBlockedProjector = new SqliteGoalBlockedProjector(db);
    const goalUnblockedProjector = new SqliteGoalUnblockedProjector(db);
    const goalPausedProjector = new SqliteGoalPausedProjector(db);
    const goalResumedProjector = new SqliteGoalResumedProjector(db);
    const goalCompletedProjector = new SqliteGoalCompletedProjector(db);
    const goalRefinedProjector = new SqliteGoalRefinedProjector(db);
    const goalResetProjector = new SqliteGoalResetProjector(db);
    const goalRemovedProjector = new SqliteGoalRemovedProjector(db);
    const goalProgressUpdatedProjector = new SqliteGoalProgressUpdatedProjector(db);
    const goalSubmittedForReviewProjector = new SqliteGoalSubmittedForReviewProjector(db);
    const goalQualifiedProjector = new SqliteGoalQualifiedProjector(db);
    const goalCommittedProjector = new SqliteGoalCommittedProjector(db);
    const goalRejectedProjector = new SqliteGoalRejectedProjector(db);
    const goalSubmittedProjector = new SqliteGoalSubmittedProjector(db);
    const goalCodifyingStartedProjector = new SqliteGoalCodifyingStartedProjector(db);
    const goalClosedProjector = new SqliteGoalClosedProjector(db);
    const goalApprovedProjector = new SqliteGoalApprovedProjector(db);
    const goalStatusMigratedProjector = new SqliteGoalStatusMigratedProjector(db);
    bus.subscribe("GoalAddedEvent", this.wrap((e) => goalAddedProjector.applyGoalAdded(e as any)));
    bus.subscribe("GoalStartedEvent", this.wrap((e) => goalStartedProjector.applyGoalStarted(e as any)));
    bus.subscribe("GoalUpdatedEvent", this.wrap((e) => goalUpdatedProjector.applyGoalUpdated(e as any)));
    bus.subscribe("GoalBlockedEvent", this.wrap((e) => goalBlockedProjector.applyGoalBlocked(e as any)));
    bus.subscribe("GoalUnblockedEvent", this.wrap((e) => goalUnblockedProjector.applyGoalUnblocked(e as any)));
    bus.subscribe("GoalPausedEvent", this.wrap((e) => goalPausedProjector.applyGoalPaused(e as any)));
    bus.subscribe("GoalResumedEvent", this.wrap((e) => goalResumedProjector.applyGoalResumed(e as any)));
    bus.subscribe("GoalCompletedEvent", this.wrap((e) => goalCompletedProjector.applyGoalCompleted(e as any)));
    bus.subscribe("GoalRefinedEvent", this.wrap((e) => goalRefinedProjector.applyGoalRefined(e as any)));
    bus.subscribe("GoalResetEvent", this.wrap((e) => goalResetProjector.applyGoalReset(e as any)));
    bus.subscribe("GoalRemovedEvent", this.wrap((e) => goalRemovedProjector.applyGoalRemoved(e as any)));
    bus.subscribe("GoalProgressUpdatedEvent", this.wrap((e) => goalProgressUpdatedProjector.applyGoalProgressUpdated(e as any)));
    bus.subscribe("GoalSubmittedForReviewEvent", this.wrap((e) => goalSubmittedForReviewProjector.applyGoalSubmittedForReview(e as any)));
    bus.subscribe("GoalQualifiedEvent", this.wrap((e) => goalQualifiedProjector.applyGoalQualified(e as any)));
    bus.subscribe("GoalRefinementStartedEvent", this.wrap((e) => goalRefinedProjector.applyGoalRefinementStarted(e as any)));
    bus.subscribe("GoalCommittedEvent", this.wrap((e) => goalCommittedProjector.applyGoalCommitted(e as any)));
    bus.subscribe("GoalRejectedEvent", this.wrap((e) => goalRejectedProjector.applyGoalRejected(e as any)));
    bus.subscribe("GoalSubmittedEvent", this.wrap((e) => goalSubmittedProjector.applyGoalSubmitted(e as any)));
    bus.subscribe("GoalCodifyingStartedEvent", this.wrap((e) => goalCodifyingStartedProjector.applyGoalCodifyingStarted(e as any)));
    bus.subscribe("GoalClosedEvent", this.wrap((e) => goalClosedProjector.applyGoalClosed(e as any)));
    bus.subscribe("GoalApprovedEvent", this.wrap((e) => goalApprovedProjector.applyGoalApproved(e as any)));
    bus.subscribe("GoalStatusMigratedEvent", this.wrap((e) => goalStatusMigratedProjector.applyGoalStatusMigrated(e as any)));

    // Architecture projections
    const architectureDefinedProjector = new SqliteArchitectureDefinedProjector(db);
    const architectureUpdatedProjector = new SqliteArchitectureUpdatedProjector(db);
    const architectureDeprecatedProjector = new SqliteArchitectureDeprecatedProjector(db);
    bus.subscribe("ArchitectureDefinedEvent", this.wrap((e) => architectureDefinedProjector.applyArchitectureDefined(e as any)));
    bus.subscribe("ArchitectureUpdatedEvent", this.wrap((e) => architectureUpdatedProjector.applyArchitectureUpdated(e as any)));
    bus.subscribe("ArchitectureDeprecatedEvent", this.wrap((e) => architectureDeprecatedProjector.applyArchitectureDeprecated(e as any)));

    // Component projections (projection-only — no cascades)
    const componentAddedProjector = new SqliteComponentAddedProjector(db);
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(db);
    const componentDeprecatedProjector = new SqliteComponentDeprecatedProjector(db);
    const componentUndeprecatedProjector = new SqliteComponentUndeprecatedProjector(db);
    const componentRemovedProjector = new SqliteComponentRemovedProjector(db);
    const componentRenamedProjector = new SqliteComponentRenamedProjector(db);
    bus.subscribe("ComponentAddedEvent", this.wrap((e) => componentAddedProjector.applyComponentAdded(e as any)));
    bus.subscribe("ComponentUpdatedEvent", this.wrap((e) => componentUpdatedProjector.applyComponentUpdated(e as any)));
    bus.subscribe("ComponentDeprecatedEvent", this.wrap((e) => componentDeprecatedProjector.applyComponentDeprecated(e as any)));
    bus.subscribe("ComponentUndeprecatedEvent", this.wrap((e) => componentUndeprecatedProjector.applyComponentUndeprecated(e as any)));
    bus.subscribe("ComponentRemovedEvent", this.wrap((e) => componentRemovedProjector.applyComponentRemoved(e as any)));
    bus.subscribe("ComponentRenamedEvent", this.wrap((e) => componentRenamedProjector.applyComponentRenamed(e as any)));

    // Dependency projections
    const dependencyAddedProjector = new SqliteDependencyAddedProjector(db);
    const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(db);
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(db);
    bus.subscribe("DependencyAddedEvent", this.wrap((e) => dependencyAddedProjector.applyDependencyAdded(e as any)));
    bus.subscribe("DependencyUpdatedEvent", this.wrap((e) => dependencyUpdatedProjector.applyDependencyUpdated(e as any)));
    bus.subscribe("DependencyRemovedEvent", this.wrap((e) => dependencyRemovedProjector.applyDependencyRemoved(e as any)));

    // Decision projections (projection-only — no cascades)
    const decisionAddedProjector = new SqliteDecisionAddedProjector(db);
    const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(db);
    const decisionReversedProjector = new SqliteDecisionReversedProjector(db);
    const decisionRestoredProjector = new SqliteDecisionRestoredProjector(db);
    const decisionSupersededProjector = new SqliteDecisionSupersededProjector(db);
    bus.subscribe("DecisionAddedEvent", this.wrap((e) => decisionAddedProjector.applyDecisionAdded(e as any)));
    bus.subscribe("DecisionUpdatedEvent", this.wrap((e) => decisionUpdatedProjector.applyDecisionUpdated(e as any)));
    bus.subscribe("DecisionReversedEvent", this.wrap((e) => decisionReversedProjector.applyDecisionReversed(e as any)));
    bus.subscribe("DecisionRestoredEvent", this.wrap((e) => decisionRestoredProjector.applyDecisionRestored(e as any)));
    bus.subscribe("DecisionSupersededEvent", this.wrap((e) => decisionSupersededProjector.applyDecisionSuperseded(e as any)));

    // Guideline projections
    const guidelineAddedProjector = new SqliteGuidelineAddedProjector(db);
    const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(db);
    const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(db);
    bus.subscribe("GuidelineAddedEvent", this.wrap((e) => guidelineAddedProjector.applyGuidelineAdded(e as any)));
    bus.subscribe("GuidelineUpdatedEvent", this.wrap((e) => guidelineUpdatedProjector.applyGuidelineUpdated(e as any)));
    bus.subscribe("GuidelineRemovedEvent", this.wrap((e) => guidelineRemovedProjector.applyGuidelineRemoved(e as any)));

    // Invariant projections
    const invariantAddedProjector = new SqliteInvariantAddedProjector(db);
    const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(db);
    const invariantRemovedProjector = new SqliteInvariantRemovedProjector(db);
    bus.subscribe("InvariantAddedEvent", this.wrap((e) => invariantAddedProjector.applyInvariantAdded(e as any)));
    bus.subscribe("InvariantUpdatedEvent", this.wrap((e) => invariantUpdatedProjector.applyInvariantUpdated(e as any)));
    bus.subscribe("InvariantRemovedEvent", this.wrap((e) => invariantRemovedProjector.applyInvariantRemoved(e as any)));

    // Project projections
    const projectInitializedProjector = new SqliteProjectInitializedProjector(db);
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(db);
    bus.subscribe("ProjectInitializedEvent", this.wrap((e) => projectInitializedProjector.applyProjectInitialized(e as any)));
    bus.subscribe("ProjectUpdatedEvent", this.wrap((e) => projectUpdatedProjector.applyProjectUpdated(e as any)));

    // Audience pain projections
    const audiencePainAddedProjector = new SqliteAudiencePainAddedProjector(db);
    const audiencePainUpdatedProjector = new SqliteAudiencePainUpdatedProjector(db);
    bus.subscribe("AudiencePainAddedEvent", this.wrap((e) => audiencePainAddedProjector.applyAudiencePainAdded(e as any)));
    bus.subscribe("AudiencePainUpdatedEvent", this.wrap((e) => audiencePainUpdatedProjector.applyAudiencePainUpdated(e as any)));

    // Audience projections
    const audienceAddedProjector = new SqliteAudienceAddedProjector(db);
    const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(db);
    const audienceRemovedProjector = new SqliteAudienceRemovedProjector(db);
    bus.subscribe("AudienceAddedEvent", this.wrap((e) => audienceAddedProjector.applyAudienceAdded(e as any)));
    bus.subscribe("AudienceUpdatedEvent", this.wrap((e) => audienceUpdatedProjector.applyAudienceUpdated(e as any)));
    bus.subscribe("AudienceRemovedEvent", this.wrap((e) => audienceRemovedProjector.applyAudienceRemoved(e as any)));

    // Value proposition projections
    const valuePropositionAddedProjector = new SqliteValuePropositionAddedProjector(db);
    const valuePropositionUpdatedProjector = new SqliteValuePropositionUpdatedProjector(db);
    const valuePropositionRemovedProjector = new SqliteValuePropositionRemovedProjector(db);
    bus.subscribe("ValuePropositionAddedEvent", this.wrap((e) => valuePropositionAddedProjector.applyValuePropositionAdded(e as any)));
    bus.subscribe("ValuePropositionUpdatedEvent", this.wrap((e) => valuePropositionUpdatedProjector.applyValuePropositionUpdated(e as any)));
    bus.subscribe("ValuePropositionRemovedEvent", this.wrap((e) => valuePropositionRemovedProjector.applyValuePropositionRemoved(e as any)));

    // Relation projections
    const relationAddedProjector = new SqliteRelationAddedProjector(db);
    const relationDeactivatedProjector = new SqliteRelationDeactivatedProjector(db);
    const relationReactivatedProjector = new SqliteRelationReactivatedProjector(db);
    const relationRemovedProjector = new SqliteRelationRemovedProjector(db);
    bus.subscribe("RelationAddedEvent", this.wrap((e) => relationAddedProjector.applyRelationAdded(e as any)));
    bus.subscribe("RelationDeactivatedEvent", this.wrap((e) => relationDeactivatedProjector.applyRelationDeactivated(e as any)));
    bus.subscribe("RelationReactivatedEvent", this.wrap((e) => relationReactivatedProjector.applyRelationReactivated(e as any)));
    bus.subscribe("RelationRemovedEvent", this.wrap((e) => relationRemovedProjector.applyRelationRemoved(e as any)));

    // Worker identity projections
    const workerIdentifiedProjector = new SqliteWorkerIdentifiedProjector(db);
    bus.subscribe("WorkerIdentifiedEvent", this.wrap((e) => workerIdentifiedProjector.applyWorkerIdentified(e as any)));

    return bus;
  }

  /**
   * Wraps a projector method as an IEventHandler.
   */
  private wrap(fn: (event: BaseEvent) => void | Promise<void>): IEventHandler {
    return { handle: async (event: BaseEvent) => { await fn(event); } };
  }
}
