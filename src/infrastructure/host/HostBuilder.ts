/**
 * Host Builder - Application Composition
 *
 * Creates the application container with all infrastructure wired.
 * All concrete type knowledge is encapsulated here.
 *
 * This class is responsible for:
 * - Creating all event stores (Fs implementations)
 * - Creating all projectors/readers (SQLite implementations)
 * - Wiring event handlers to event bus
 * - Returning container with interfaces only
 *
 * Key Design:
 * - ALL concrete imports are in this file (better-sqlite3, Sqlite*, Fs*)
 * - Returns IApplicationContainer (interfaces only)
 * - Presentation layer never sees concrete types
 */

import Database from "better-sqlite3";
import { IApplicationContainer } from "../../application/host/IApplicationContainer.js";
import { IEventStore } from "../../application/persistence/IEventStore.js";
import { IEventBus } from "../../application/messaging/IEventBus.js";
import { IClock } from "../../application/time-and-date/IClock.js";
import { IDatabaseRebuildService } from "../../application/maintenance/db/rebuild/IDatabaseRebuildService.js";

// Infrastructure implementations
import { FsEventStore } from "../persistence/FsEventStore.js";
import { InProcessEventBus } from "../messaging/InProcessEventBus.js";
import { SystemClock } from "../time-and-date/SystemClock.js";
// TEMPORARY: Use sequential rebuild service to avoid race conditions
// TODO: Swap back to LocalDatabaseRebuildService when Epic/Feature/Task redesign is complete
import { TemporarySequentialDatabaseRebuildService } from "../local/TemporarySequentialDatabaseRebuildService.js";

// Session Event Stores - decomposed by use case
import { FsSessionStartedEventStore } from "../sessions/start/FsSessionStartedEventStore.js";
import { FsSessionEndedEventStore } from "../sessions/end/FsSessionEndedEventStore.js";
// Goal Event Stores - decomposed by use case
import { FsGoalAddedEventStore } from "../goals/add/FsGoalAddedEventStore.js";
import { FsGoalStartedEventStore } from "../goals/start/FsGoalStartedEventStore.js";
import { FsGoalUpdatedEventStore } from "../goals/update/FsGoalUpdatedEventStore.js";
import { FsGoalBlockedEventStore } from "../goals/block/FsGoalBlockedEventStore.js";
import { FsGoalUnblockedEventStore } from "../goals/unblock/FsGoalUnblockedEventStore.js";
import { FsGoalPausedEventStore } from "../goals/pause/FsGoalPausedEventStore.js";
import { FsGoalResumedEventStore } from "../goals/resume/FsGoalResumedEventStore.js";
import { FsGoalCompletedEventStore } from "../goals/complete/FsGoalCompletedEventStore.js";
import { FsGoalResetEventStore } from "../goals/reset/FsGoalResetEventStore.js";
import { FsGoalRemovedEventStore } from "../goals/remove/FsGoalRemovedEventStore.js";
import { FsGoalProgressUpdatedEventStore } from "../goals/update-progress/FsGoalProgressUpdatedEventStore.js";
// Decision Event Stores - decomposed by use case
import { FsDecisionAddedEventStore } from "../decisions/add/FsDecisionAddedEventStore.js";
import { FsDecisionUpdatedEventStore } from "../decisions/update/FsDecisionUpdatedEventStore.js";
import { FsDecisionReversedEventStore } from "../decisions/reverse/FsDecisionReversedEventStore.js";
import { FsDecisionSupersededEventStore } from "../decisions/supersede/FsDecisionSupersededEventStore.js";
// Architecture Event Stores - decomposed by use case
import { FsArchitectureDefinedEventStore } from "../architecture/define/FsArchitectureDefinedEventStore.js";
import { FsArchitectureUpdatedEventStore } from "../architecture/update/FsArchitectureUpdatedEventStore.js";
// Component Event Stores - decomposed by use case
import { FsComponentAddedEventStore } from "../components/add/FsComponentAddedEventStore.js";
import { FsComponentUpdatedEventStore } from "../components/update/FsComponentUpdatedEventStore.js";
import { FsComponentDeprecatedEventStore } from "../components/deprecate/FsComponentDeprecatedEventStore.js";
import { FsComponentRemovedEventStore } from "../components/remove/FsComponentRemovedEventStore.js";
// Dependency Event Stores - decomposed by use case
import { FsDependencyAddedEventStore } from "../dependencies/add/FsDependencyAddedEventStore.js";
import { FsDependencyUpdatedEventStore } from "../dependencies/update/FsDependencyUpdatedEventStore.js";
import { FsDependencyRemovedEventStore } from "../dependencies/remove/FsDependencyRemovedEventStore.js";
// Guideline Event Stores - decomposed by use case
import { FsGuidelineAddedEventStore } from "../guidelines/add/FsGuidelineAddedEventStore.js";
import { FsGuidelineUpdatedEventStore } from "../guidelines/update/FsGuidelineUpdatedEventStore.js";
import { FsGuidelineRemovedEventStore } from "../guidelines/remove/FsGuidelineRemovedEventStore.js";
// Invariant Event Stores - decomposed by use case
import { FsInvariantAddedEventStore } from "../invariants/add/FsInvariantAddedEventStore.js";
import { FsInvariantUpdatedEventStore } from "../invariants/update/FsInvariantUpdatedEventStore.js";
import { FsInvariantRemovedEventStore } from "../invariants/remove/FsInvariantRemovedEventStore.js";
// Project Event Stores - decomposed by use case
import { FsProjectInitializedEventStore } from "../project/init/FsProjectInitializedEventStore.js";
import { FsProjectUpdatedEventStore } from "../project/update/FsProjectUpdatedEventStore.js";
// Audience Event Stores - decomposed by use case
import { FsAudienceAddedEventStore } from "../audiences/add/FsAudienceAddedEventStore.js";
import { FsAudienceUpdatedEventStore } from "../audiences/update/FsAudienceUpdatedEventStore.js";
import { FsAudienceRemovedEventStore } from "../audiences/remove/FsAudienceRemovedEventStore.js";
// AudiencePain Event Stores - decomposed by use case
import { FsAudiencePainAddedEventStore } from "../audience-pains/add/FsAudiencePainAddedEventStore.js";
import { FsAudiencePainUpdatedEventStore } from "../audience-pains/update/FsAudiencePainUpdatedEventStore.js";
import { FsAudiencePainResolvedEventStore } from "../audience-pains/resolve/FsAudiencePainResolvedEventStore.js";
// ValueProposition Event Stores - decomposed by use case
import { FsValuePropositionAddedEventStore } from "../value-propositions/add/FsValuePropositionAddedEventStore.js";
import { FsValuePropositionUpdatedEventStore } from "../value-propositions/update/FsValuePropositionUpdatedEventStore.js";
import { FsValuePropositionRemovedEventStore } from "../value-propositions/remove/FsValuePropositionRemovedEventStore.js";
// Relations Event Stores - decomposed by use case
import { FsRelationAddedEventStore } from "../relations/add/FsRelationAddedEventStore.js";
import { FsRelationRemovedEventStore } from "../relations/remove/FsRelationRemovedEventStore.js";

// Session Projection Stores - decomposed by use case
import { SqliteSessionStartedProjector } from "../sessions/start/SqliteSessionStartedProjector.js";
import { SqliteSessionEndedProjector } from "../sessions/end/SqliteSessionEndedProjector.js";
import { SqliteActiveSessionReader } from "../sessions/end/SqliteActiveSessionReader.js";
import { SqliteSessionListReader } from "../sessions/list/SqliteSessionListReader.js";
import { SqliteSessionSummaryProjectionStore } from "../sessions/get-context/SqliteSessionSummaryProjectionStore.js";
import { SqliteSessionSummaryReader } from "../sessions/get-context/SqliteSessionSummaryReader.js";
// Goal Projection Stores - decomposed by use case
import { SqliteGoalAddedProjector } from "../goals/add/SqliteGoalAddedProjector.js";
import { SqliteGoalStartedProjector } from "../goals/start/SqliteGoalStartedProjector.js";
import { SqliteGoalUpdatedProjector } from "../goals/update/SqliteGoalUpdatedProjector.js";
import { SqliteGoalBlockedProjector } from "../goals/block/SqliteGoalBlockedProjector.js";
import { SqliteGoalUnblockedProjector } from "../goals/unblock/SqliteGoalUnblockedProjector.js";
import { SqliteGoalPausedProjector } from "../goals/pause/SqliteGoalPausedProjector.js";
import { SqliteGoalResumedProjector } from "../goals/resume/SqliteGoalResumedProjector.js";
import { SqliteGoalCompletedProjector } from "../goals/complete/SqliteGoalCompletedProjector.js";
import { SqliteGoalResetProjector } from "../goals/reset/SqliteGoalResetProjector.js";
import { SqliteGoalRemovedProjector } from "../goals/remove/SqliteGoalRemovedProjector.js";
import { SqliteGoalProgressUpdatedProjector } from "../goals/update-progress/SqliteGoalProgressUpdatedProjector.js";
import { SqliteGoalSubmittedForReviewProjector } from "../goals/review/SqliteGoalSubmittedForReviewProjector.js";
import { SqliteGoalQualifiedProjector } from "../goals/qualify/SqliteGoalQualifiedProjector.js";
import { SqliteGoalContextReader } from "../goals/get-context/SqliteGoalContextReader.js";
import { SqliteGoalStatusReader } from "../goals/SqliteGoalStatusReader.js";
// Decision Projection Stores - decomposed by use case
import { SqliteDecisionAddedProjector } from "../decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionUpdatedProjector } from "../decisions/update/SqliteDecisionUpdatedProjector.js";
import { SqliteDecisionReversedProjector } from "../decisions/reverse/SqliteDecisionReversedProjector.js";
import { SqliteDecisionSupersededProjector } from "../decisions/supersede/SqliteDecisionSupersededProjector.js";
import { SqliteDecisionContextReader } from "../decisions/get-context/SqliteDecisionContextReader.js";
import { SqliteDecisionSessionReader } from "../decisions/get-context/SqliteDecisionSessionReader.js";
import { SqliteDecisionListReader } from "../decisions/list/SqliteDecisionListReader.js";
// Architecture Projection Stores - decomposed by use case
import { SqliteArchitectureDefinedProjector } from "../architecture/define/SqliteArchitectureDefinedProjector.js";
import { SqliteArchitectureUpdatedProjector } from "../architecture/update/SqliteArchitectureUpdatedProjector.js";
import { SqliteArchitectureReader } from "../architecture/SqliteArchitectureReader.js";
// Component Projection Stores - decomposed by use case
import { SqliteComponentAddedProjector } from "../components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../components/update/SqliteComponentUpdatedProjector.js";
import { SqliteComponentDeprecatedProjector } from "../components/deprecate/SqliteComponentDeprecatedProjector.js";
import { SqliteComponentRemovedProjector } from "../components/remove/SqliteComponentRemovedProjector.js";
import { SqliteComponentContextReader } from "../components/get-context/SqliteComponentContextReader.js";
import { SqliteComponentListReader } from "../components/list/SqliteComponentListReader.js";
// Dependency Projection Stores - decomposed by use case
import { SqliteDependencyAddedProjector } from "../dependencies/add/SqliteDependencyAddedProjector.js";
import { SqliteDependencyUpdatedProjector } from "../dependencies/update/SqliteDependencyUpdatedProjector.js";
import { SqliteDependencyRemovedProjector } from "../dependencies/remove/SqliteDependencyRemovedProjector.js";
import { SqliteDependencyContextReader } from "../dependencies/get-context/SqliteDependencyContextReader.js";
import { SqliteDependencyListReader } from "../dependencies/list/SqliteDependencyListReader.js";
// Guideline Projection Stores - decomposed by use case
import { SqliteGuidelineAddedProjector } from "../guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../guidelines/remove/SqliteGuidelineRemovedProjector.js";
import { SqliteGuidelineContextReader } from "../guidelines/get-context/SqliteGuidelineContextReader.js";
import { SqliteGuidelineListReader } from "../guidelines/list/SqliteGuidelineListReader.js";
// Invariant Projection Stores - decomposed by use case
import { SqliteInvariantAddedProjector } from "../invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../invariants/remove/SqliteInvariantRemovedProjector.js";
import { SqliteInvariantContextReader } from "../invariants/get-context/SqliteInvariantContextReader.js";
import { SqliteInvariantListReader } from "../invariants/list/SqliteInvariantListReader.js";
// Relations Projection Stores - decomposed by use case
import { SqliteRelationAddedProjector } from "../relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationRemovedProjector } from "../relations/remove/SqliteRelationRemovedProjector.js";
import { SqliteRelationListReader } from "../relations/list/SqliteRelationListReader.js";
// AudiencePain Projection Stores - decomposed by use case
import { SqliteAudiencePainAddedProjector } from "../audience-pains/add/SqliteAudiencePainAddedProjector.js";
import { SqliteAudiencePainUpdatedProjector } from "../audience-pains/update/SqliteAudiencePainUpdatedProjector.js";
import { SqliteAudiencePainResolvedProjector } from "../audience-pains/resolve/SqliteAudiencePainResolvedProjector.js";
// Audience Projection Stores - decomposed by use case
import { SqliteAudienceAddedProjector } from "../audiences/add/SqliteAudienceAddedProjector.js";
import { SqliteAudienceUpdatedProjector } from "../audiences/update/SqliteAudienceUpdatedProjector.js";
import { SqliteAudienceRemovedProjector } from "../audiences/remove/SqliteAudienceRemovedProjector.js";
// ValueProposition Projection Stores - decomposed by use case
import { SqliteValuePropositionAddedProjector } from "../value-propositions/add/SqliteValuePropositionAddedProjector.js";
import { SqliteValuePropositionUpdatedProjector } from "../value-propositions/update/SqliteValuePropositionUpdatedProjector.js";
import { SqliteValuePropositionRemovedProjector } from "../value-propositions/remove/SqliteValuePropositionRemovedProjector.js";
// Project Projection Stores - decomposed by use case
import { SqliteProjectInitializedProjector } from "../project/init/SqliteProjectInitializedProjector.js";
import { SqliteProjectUpdatedProjector } from "../project/update/SqliteProjectUpdatedProjector.js";
import { SqliteProjectContextReader } from "../project/query/SqliteProjectContextReader.js";
// Project Services
import { AgentFileProtocol } from "../project/init/AgentFileProtocol.js";
import { InitializationProtocol } from "../../application/project/init/InitializationProtocol.js";
import { InitializeProjectCommandHandler } from "../../application/project/init/InitializeProjectCommandHandler.js";
// Audience Context Reader
import { SqliteAudienceContextReader } from "../audiences/query/SqliteAudienceContextReader.js";
// AudiencePain Context Reader
import { SqliteAudiencePainContextReader } from "../audience-pains/query/SqliteAudiencePainContextReader.js";
// ValueProposition Context Reader
import { SqliteValuePropositionContextReader } from "../value-propositions/query/SqliteValuePropositionContextReader.js";
// CLI Version Reader
import { CliVersionReader } from "../cli-metadata/query/CliVersionReader.js";
// Solution Context Reader
import { SqliteSolutionContextReader } from "../SqliteSolutionContextReader.js";
// Settings Infrastructure
import { FsSettingsReader } from "../settings/FsSettingsReader.js";
import { FsSettingsInitializer } from "../settings/FsSettingsInitializer.js";

// Event Handlers (Projection Handlers)
import { SessionStartedEventHandler } from "../../application/sessions/start/SessionStartedEventHandler.js";
import { SessionEndedEventHandler } from "../../application/sessions/end/SessionEndedEventHandler.js";
import { SessionSummaryProjectionHandler } from "../../application/sessions/get-context/SessionSummaryProjectionHandler.js";
import { GoalAddedEventHandler } from "../../application/goals/add/GoalAddedEventHandler.js";
import { GoalStartedEventHandler } from "../../application/goals/start/GoalStartedEventHandler.js";
import { GoalUpdatedEventHandler } from "../../application/goals/update/GoalUpdatedEventHandler.js";
import { GoalBlockedEventHandler } from "../../application/goals/block/GoalBlockedEventHandler.js";
import { GoalUnblockedEventHandler } from "../../application/goals/unblock/GoalUnblockedEventHandler.js";
import { GoalPausedEventHandler } from "../../application/goals/pause/GoalPausedEventHandler.js";
import { GoalResumedEventHandler } from "../../application/goals/resume/GoalResumedEventHandler.js";
import { GoalCompletedEventHandler } from "../../application/goals/complete/GoalCompletedEventHandler.js";
import { GoalResetEventHandler } from "../../application/goals/reset/GoalResetEventHandler.js";
import { GoalRemovedEventHandler } from "../../application/goals/remove/GoalRemovedEventHandler.js";
import { GoalProgressUpdatedEventHandler } from "../../application/goals/update-progress/GoalProgressUpdatedEventHandler.js";
import { GoalSubmittedForReviewEventHandler } from "../../application/goals/review/GoalSubmittedForReviewEventHandler.js";
import { GoalQualifiedEventHandler } from "../../application/goals/qualify/GoalQualifiedEventHandler.js";
// Decision Event Handlers - decomposed by use case
import { DecisionAddedEventHandler } from "../../application/decisions/add/DecisionAddedEventHandler.js";
import { DecisionUpdatedEventHandler } from "../../application/decisions/update/DecisionUpdatedEventHandler.js";
import { DecisionReversedEventHandler } from "../../application/decisions/reverse/DecisionReversedEventHandler.js";
import { DecisionSupersededEventHandler } from "../../application/decisions/supersede/DecisionSupersededEventHandler.js";
// Architecture Event Handlers - decomposed by use case
import { ArchitectureDefinedEventHandler } from "../../application/architecture/define/ArchitectureDefinedEventHandler.js";
import { ArchitectureUpdatedEventHandler } from "../../application/architecture/update/ArchitectureUpdatedEventHandler.js";
// Component Event Handlers - decomposed by use case
import { ComponentAddedEventHandler } from "../../application/components/add/ComponentAddedEventHandler.js";
import { ComponentUpdatedEventHandler } from "../../application/components/update/ComponentUpdatedEventHandler.js";
import { ComponentDeprecatedEventHandler } from "../../application/components/deprecate/ComponentDeprecatedEventHandler.js";
import { ComponentRemovedEventHandler } from "../../application/components/remove/ComponentRemovedEventHandler.js";
// Dependency Event Handlers - decomposed by use case
import { DependencyAddedEventHandler } from "../../application/dependencies/add/DependencyAddedEventHandler.js";
import { DependencyUpdatedEventHandler } from "../../application/dependencies/update/DependencyUpdatedEventHandler.js";
import { DependencyRemovedEventHandler } from "../../application/dependencies/remove/DependencyRemovedEventHandler.js";
// Guideline Event Handlers - decomposed by use case
import { GuidelineAddedEventHandler } from "../../application/guidelines/add/GuidelineAddedEventHandler.js";
import { GuidelineUpdatedEventHandler } from "../../application/guidelines/update/GuidelineUpdatedEventHandler.js";
import { GuidelineRemovedEventHandler } from "../../application/guidelines/remove/GuidelineRemovedEventHandler.js";
// Invariant Event Handlers - decomposed by use case
import { InvariantAddedEventHandler } from "../../application/invariants/add/InvariantAddedEventHandler.js";
import { InvariantUpdatedEventHandler } from "../../application/invariants/update/InvariantUpdatedEventHandler.js";
import { InvariantRemovedEventHandler } from "../../application/invariants/remove/InvariantRemovedEventHandler.js";
// Project Event Handlers - decomposed by use case
import { ProjectInitializedEventHandler } from "../../application/project/init/ProjectInitializedEventHandler.js";
import { ProjectUpdatedEventHandler } from "../../application/project/update/ProjectUpdatedEventHandler.js";
// AudiencePain Event Handlers - decomposed by use case
import { AudiencePainAddedEventHandler } from "../../application/audience-pains/add/AudiencePainAddedEventHandler.js";
import { AudiencePainUpdatedEventHandler } from "../../application/audience-pains/update/AudiencePainUpdatedEventHandler.js";
import { AudiencePainResolvedEventHandler } from "../../application/audience-pains/resolve/AudiencePainResolvedEventHandler.js";
// Audience Event Handlers - decomposed by use case
import { AudienceAddedEventHandler } from "../../application/audiences/add/AudienceAddedEventHandler.js";
import { AudienceUpdatedEventHandler } from "../../application/audiences/update/AudienceUpdatedEventHandler.js";
import { AudienceRemovedEventHandler } from "../../application/audiences/remove/AudienceRemovedEventHandler.js";
// ValueProposition Event Handlers - decomposed by use case
import { ValuePropositionAddedEventHandler } from "../../application/value-propositions/add/ValuePropositionAddedEventHandler.js";
import { ValuePropositionUpdatedEventHandler } from "../../application/value-propositions/update/ValuePropositionUpdatedEventHandler.js";
import { ValuePropositionRemovedEventHandler } from "../../application/value-propositions/remove/ValuePropositionRemovedEventHandler.js";
// Relations Event Handlers - decomposed by use case
import { RelationAddedEventHandler } from "../../application/relations/add/RelationAddedEventHandler.js";
import { RelationRemovedEventHandler } from "../../application/relations/remove/RelationRemovedEventHandler.js";

// Goal Controllers
import { CompleteGoalController } from "../../application/goals/complete/CompleteGoalController.js";
import { CompleteGoalCommandHandler } from "../../application/goals/complete/CompleteGoalCommandHandler.js";
import { GetGoalContextQueryHandler } from "../../application/goals/get-context/GetGoalContextQueryHandler.js";
import { ReviewGoalController } from "../../application/goals/review/ReviewGoalController.js";
import { SubmitGoalForReviewCommandHandler } from "../../application/goals/review/SubmitGoalForReviewCommandHandler.js";
import { FsGoalSubmittedForReviewEventStore } from "../goals/review/FsGoalSubmittedForReviewEventStore.js";
import { QualifyGoalController } from "../../application/goals/qualify/QualifyGoalController.js";
import { QualifyGoalCommandHandler } from "../../application/goals/qualify/QualifyGoalCommandHandler.js";
import { FsGoalQualifiedEventStore } from "../goals/qualify/FsGoalQualifiedEventStore.js";

// Solution Context
import { UnprimedBrownfieldQualifier } from "../../application/UnprimedBrownfieldQualifier.js";

// Worker Identity
import { HostSessionKeyResolver } from "./session/HostSessionKeyResolver.js";
import { FsWorkerIdentityRegistry } from "./workers/FsWorkerIdentityRegistry.js";

// Goal Claims
import { FsGoalClaimStore } from "../goals/claims/FsGoalClaimStore.js";
import { GoalClaimPolicy } from "../../application/goals/claims/GoalClaimPolicy.js";

export class HostBuilder {
  private readonly rootDir: string;
  private readonly db: Database.Database;

  constructor(rootDir: string, db: Database.Database) {
    this.rootDir = rootDir;
    this.db = db;
  }

  /**
   * Builds the application container with all infrastructure wired.
   *
   * Creates all event stores, projectors, readers, and wires event handlers
   * to the event bus. Returns an IApplicationContainer with interfaces only.
   *
   * @returns Promise<IApplicationContainer> - Container with all services
   */
  async build(): Promise<IApplicationContainer> {
    // ============================================================
    // STEP 1: Get Core Infrastructure
    // ============================================================

    const eventStore = new FsEventStore(this.rootDir);
    const eventBus = new InProcessEventBus();
    const clock = new SystemClock();
    const cliVersionReader = new CliVersionReader();

    // Initialize settings file if it doesn't exist
    const settingsInitializer = new FsSettingsInitializer(this.rootDir);
    await settingsInitializer.ensureSettingsFileExists();

    const settingsReader = new FsSettingsReader(this.rootDir);

    // Create worker identity components
    const hostSessionKeyResolver = new HostSessionKeyResolver();
    const workerIdentityReader = new FsWorkerIdentityRegistry(
      this.rootDir,
      hostSessionKeyResolver
    );

    // Create goal claim components
    const goalClaimStore = new FsGoalClaimStore(this.rootDir);
    const goalClaimPolicy = new GoalClaimPolicy(goalClaimStore, clock);

    // Create database rebuild service
    // TEMPORARY: Uses sequential event bus to avoid race conditions during rebuild
    // TODO: Swap back to LocalDatabaseRebuildService when Epic/Feature/Task redesign is complete
    const databaseRebuildService = new TemporarySequentialDatabaseRebuildService(
      this.rootDir,
      this.db,
      eventStore
    );

    // ============================================================
    // STEP 2: Create Domain Event Stores
    // ============================================================

    // Work Category - Session Event Stores - decomposed by use case
    const sessionStartedEventStore = new FsSessionStartedEventStore(this.rootDir);
    const sessionEndedEventStore = new FsSessionEndedEventStore(this.rootDir);
    // Goal Event Stores - decomposed by use case
    const goalAddedEventStore = new FsGoalAddedEventStore(this.rootDir);
    const goalStartedEventStore = new FsGoalStartedEventStore(this.rootDir);
    const goalUpdatedEventStore = new FsGoalUpdatedEventStore(this.rootDir);
    const goalBlockedEventStore = new FsGoalBlockedEventStore(this.rootDir);
    const goalUnblockedEventStore = new FsGoalUnblockedEventStore(this.rootDir);
    const goalPausedEventStore = new FsGoalPausedEventStore(this.rootDir);
    const goalResumedEventStore = new FsGoalResumedEventStore(this.rootDir);
    const goalCompletedEventStore = new FsGoalCompletedEventStore(this.rootDir);
    const goalResetEventStore = new FsGoalResetEventStore(this.rootDir);
    const goalRemovedEventStore = new FsGoalRemovedEventStore(this.rootDir);
    const goalProgressUpdatedEventStore = new FsGoalProgressUpdatedEventStore(this.rootDir);
    const goalSubmittedForReviewEventStore = new FsGoalSubmittedForReviewEventStore(this.rootDir);
    const goalQualifiedEventStore = new FsGoalQualifiedEventStore(this.rootDir);

    // Solution Category
    // Architecture Event Stores - decomposed by use case
    const architectureDefinedEventStore = new FsArchitectureDefinedEventStore(this.rootDir);
    const architectureUpdatedEventStore = new FsArchitectureUpdatedEventStore(this.rootDir);
    // Component Event Stores - decomposed by use case
    const componentAddedEventStore = new FsComponentAddedEventStore(this.rootDir);
    const componentUpdatedEventStore = new FsComponentUpdatedEventStore(this.rootDir);
    const componentDeprecatedEventStore = new FsComponentDeprecatedEventStore(this.rootDir);
    const componentRemovedEventStore = new FsComponentRemovedEventStore(this.rootDir);
    // Dependency Event Stores - decomposed by use case
    const dependencyAddedEventStore = new FsDependencyAddedEventStore(this.rootDir);
    const dependencyUpdatedEventStore = new FsDependencyUpdatedEventStore(this.rootDir);
    const dependencyRemovedEventStore = new FsDependencyRemovedEventStore(this.rootDir);
    // Decision Event Stores - decomposed by use case
    const decisionAddedEventStore = new FsDecisionAddedEventStore(this.rootDir);
    const decisionUpdatedEventStore = new FsDecisionUpdatedEventStore(this.rootDir);
    const decisionReversedEventStore = new FsDecisionReversedEventStore(this.rootDir);
    const decisionSupersededEventStore = new FsDecisionSupersededEventStore(this.rootDir);
    // Guideline Event Stores - decomposed by use case
    const guidelineAddedEventStore = new FsGuidelineAddedEventStore(this.rootDir);
    const guidelineUpdatedEventStore = new FsGuidelineUpdatedEventStore(this.rootDir);
    const guidelineRemovedEventStore = new FsGuidelineRemovedEventStore(this.rootDir);
    // Invariant Event Stores - decomposed by use case
    const invariantAddedEventStore = new FsInvariantAddedEventStore(this.rootDir);
    const invariantUpdatedEventStore = new FsInvariantUpdatedEventStore(this.rootDir);
    const invariantRemovedEventStore = new FsInvariantRemovedEventStore(this.rootDir);

    // Project Knowledge Category
    // Project Event Stores - decomposed by use case
    const projectInitializedEventStore = new FsProjectInitializedEventStore(this.rootDir);
    const projectUpdatedEventStore = new FsProjectUpdatedEventStore(this.rootDir);
    // Project Services
    const agentFileProtocol = new AgentFileProtocol();
    // Audience Event Stores - decomposed by use case
    const audienceAddedEventStore = new FsAudienceAddedEventStore(this.rootDir);
    const audienceUpdatedEventStore = new FsAudienceUpdatedEventStore(this.rootDir);
    const audienceRemovedEventStore = new FsAudienceRemovedEventStore(this.rootDir);
    // AudiencePain Event Stores - decomposed by use case
    const audiencePainAddedEventStore = new FsAudiencePainAddedEventStore(this.rootDir);
    const audiencePainUpdatedEventStore = new FsAudiencePainUpdatedEventStore(this.rootDir);
    const audiencePainResolvedEventStore = new FsAudiencePainResolvedEventStore(this.rootDir);
    // ValueProposition Event Stores - decomposed by use case
    const valuePropositionAddedEventStore = new FsValuePropositionAddedEventStore(this.rootDir);
    const valuePropositionUpdatedEventStore = new FsValuePropositionUpdatedEventStore(this.rootDir);
    const valuePropositionRemovedEventStore = new FsValuePropositionRemovedEventStore(this.rootDir);

    // Relations Category - Event Stores - decomposed by use case
    const relationAddedEventStore = new FsRelationAddedEventStore(this.rootDir);
    const relationRemovedEventStore = new FsRelationRemovedEventStore(this.rootDir);

    // ============================================================
    // STEP 3: Create Projection Stores (Read Models)
    // ============================================================

    // Work Category - Session Projection Stores - decomposed by use case
    const sessionStartedProjector = new SqliteSessionStartedProjector(this.db);
    const sessionEndedProjector = new SqliteSessionEndedProjector(this.db);
    const activeSessionReader = new SqliteActiveSessionReader(this.db);
    const sessionSummaryProjectionStore = new SqliteSessionSummaryProjectionStore(this.db);
    const sessionSummaryReader = new SqliteSessionSummaryReader(this.db);
    const sessionListReader = new SqliteSessionListReader(this.db);
    // Goal Projection Stores - decomposed by use case
    const goalAddedProjector = new SqliteGoalAddedProjector(this.db);
    const goalStartedProjector = new SqliteGoalStartedProjector(this.db);
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(this.db);
    const goalBlockedProjector = new SqliteGoalBlockedProjector(this.db);
    const goalUnblockedProjector = new SqliteGoalUnblockedProjector(this.db);
    const goalPausedProjector = new SqliteGoalPausedProjector(this.db);
    const goalResumedProjector = new SqliteGoalResumedProjector(this.db);
    const goalCompletedProjector = new SqliteGoalCompletedProjector(this.db);
    const goalResetProjector = new SqliteGoalResetProjector(this.db);
    const goalRemovedProjector = new SqliteGoalRemovedProjector(this.db);
    const goalProgressUpdatedProjector = new SqliteGoalProgressUpdatedProjector(this.db);
    const goalSubmittedForReviewProjector = new SqliteGoalSubmittedForReviewProjector(this.db);
    const goalQualifiedProjector = new SqliteGoalQualifiedProjector(this.db);
    const goalContextReader = new SqliteGoalContextReader(this.db);
    const goalStatusReader = new SqliteGoalStatusReader(this.db);

    // Solution Category
    // Architecture Projection Stores - decomposed by use case
    const architectureDefinedProjector = new SqliteArchitectureDefinedProjector(this.db);
    const architectureUpdatedProjector = new SqliteArchitectureUpdatedProjector(this.db);
    const architectureReader = new SqliteArchitectureReader(this.db);
    const architectureViewer = architectureReader;
    // Component Projection Stores - decomposed by use case
    const componentAddedProjector = new SqliteComponentAddedProjector(this.db);
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(this.db);
    const componentDeprecatedProjector = new SqliteComponentDeprecatedProjector(this.db);
    const componentRemovedProjector = new SqliteComponentRemovedProjector(this.db);
    const componentContextReader = new SqliteComponentContextReader(this.db);
    const componentListReader = new SqliteComponentListReader(this.db);
    // Dependency Projection Stores - decomposed by use case
    const dependencyAddedProjector = new SqliteDependencyAddedProjector(this.db);
    const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(this.db);
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(this.db);
    const dependencyContextReader = new SqliteDependencyContextReader(this.db);
    const dependencyListReader = new SqliteDependencyListReader(this.db);
    // Decision Projection Stores - decomposed by use case
    const decisionAddedProjector = new SqliteDecisionAddedProjector(this.db);
    const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(this.db);
    const decisionReversedProjector = new SqliteDecisionReversedProjector(this.db);
    const decisionSupersededProjector = new SqliteDecisionSupersededProjector(this.db);
    const decisionContextReader = new SqliteDecisionContextReader(this.db);
    const decisionSessionReader = new SqliteDecisionSessionReader(this.db);
    const decisionListReader = new SqliteDecisionListReader(this.db);
    // Guideline Projection Stores - decomposed by use case
    const guidelineAddedProjector = new SqliteGuidelineAddedProjector(this.db);
    const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(this.db);
    const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(this.db);
    const guidelineContextReader = new SqliteGuidelineContextReader(this.db);
    const guidelineListReader = new SqliteGuidelineListReader(this.db);
    // Invariant Projection Stores - decomposed by use case
    const invariantAddedProjector = new SqliteInvariantAddedProjector(this.db);
    const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(this.db);
    const invariantRemovedProjector = new SqliteInvariantRemovedProjector(this.db);
    const invariantContextReader = new SqliteInvariantContextReader(this.db);
    const invariantListReader = new SqliteInvariantListReader(this.db);
    // Solution Context - cross-cutting reader and qualifier
    const solutionContextReader = new SqliteSolutionContextReader(this.db);
    const unprimedBrownfieldQualifier = new UnprimedBrownfieldQualifier(solutionContextReader);

    // Project Knowledge Category
    // Project Projection Stores - decomposed by use case
    const projectInitializedProjector = new SqliteProjectInitializedProjector(this.db);
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(this.db);
    const projectContextReader = new SqliteProjectContextReader(this.db);
    // Audience Projection Stores - decomposed by use case
    const audienceAddedProjector = new SqliteAudienceAddedProjector(this.db);
    const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(this.db);
    const audienceRemovedProjector = new SqliteAudienceRemovedProjector(this.db);
    const audienceContextReader = new SqliteAudienceContextReader(this.db);
    // AudiencePain Projection Stores - decomposed by use case
    const audiencePainAddedProjector = new SqliteAudiencePainAddedProjector(this.db);
    const audiencePainUpdatedProjector = new SqliteAudiencePainUpdatedProjector(this.db);
    const audiencePainResolvedProjector = new SqliteAudiencePainResolvedProjector(this.db);
    const audiencePainContextReader = new SqliteAudiencePainContextReader(this.db);
    // ValueProposition Projection Stores - decomposed by use case
    const valuePropositionAddedProjector = new SqliteValuePropositionAddedProjector(this.db);
    const valuePropositionUpdatedProjector = new SqliteValuePropositionUpdatedProjector(this.db);
    const valuePropositionRemovedProjector = new SqliteValuePropositionRemovedProjector(this.db);
    const valuePropositionContextReader = new SqliteValuePropositionContextReader(this.db);

    // Relations Category - Projection Stores - decomposed by use case
    const relationAddedProjector = new SqliteRelationAddedProjector(this.db);
    const relationRemovedProjector = new SqliteRelationRemovedProjector(this.db);
    const relationListReader = new SqliteRelationListReader(this.db);

    // ============================================================
    // STEP 4: Create Application Services / Controllers
    // ============================================================

    // Goal Controllers
    const completeGoalCommandHandler = new CompleteGoalCommandHandler(
      goalCompletedEventStore,
      goalCompletedEventStore,
      goalCompletedProjector,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader
    );
    const getGoalContextQueryHandler = new GetGoalContextQueryHandler(
      goalContextReader,
      componentContextReader,
      dependencyContextReader,
      decisionContextReader,
      invariantContextReader,
      guidelineContextReader,
      architectureReader,
      relationRemovedProjector
    );
    const completeGoalController = new CompleteGoalController(
      completeGoalCommandHandler,
      goalCompletedProjector,
      goalClaimPolicy,
      workerIdentityReader
    );
    // ReviewGoalController dependencies
    const submitGoalForReviewCommandHandler = new SubmitGoalForReviewCommandHandler(
      goalSubmittedForReviewEventStore,
      goalSubmittedForReviewEventStore,
      goalContextReader,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader
    );
    const reviewGoalController = new ReviewGoalController(
      submitGoalForReviewCommandHandler,
      getGoalContextQueryHandler,
      goalContextReader,
      goalClaimPolicy,
      workerIdentityReader
    );
    // QualifyGoalController dependencies
    const qualifyGoalCommandHandler = new QualifyGoalCommandHandler(
      goalQualifiedEventStore,
      goalQualifiedEventStore,
      goalContextReader,
      eventBus,
      goalClaimPolicy,
      workerIdentityReader
    );
    const qualifyGoalController = new QualifyGoalController(
      qualifyGoalCommandHandler,
      goalContextReader,
      goalClaimPolicy,
      workerIdentityReader
    );

    // Project Initialization Protocol
    const initializeProjectCommandHandler = new InitializeProjectCommandHandler(
      projectInitializedEventStore,
      eventBus,
      projectInitializedProjector,
      agentFileProtocol,
      settingsInitializer
    );
    const initializationProtocol = new InitializationProtocol(
      initializeProjectCommandHandler,
      agentFileProtocol,
      settingsInitializer
    );

    // ============================================================
    // STEP 5: Create Projection Handlers (Event Subscribers)
    // ============================================================

    // Work Category - Session Projection Handlers - using decomposed projectors
    const sessionStartedEventHandler = new SessionStartedEventHandler(sessionStartedProjector);
    const sessionEndedEventHandler = new SessionEndedEventHandler(sessionEndedProjector);
    const sessionSummaryProjectionHandler = new SessionSummaryProjectionHandler(
      eventBus,
      sessionSummaryProjectionStore,
      goalStatusReader,
      decisionSessionReader
    );
    const goalAddedEventHandler = new GoalAddedEventHandler(goalAddedProjector);
    const goalStartedEventHandler = new GoalStartedEventHandler(goalStartedProjector);
    const goalUpdatedEventHandler = new GoalUpdatedEventHandler(goalUpdatedProjector);
    const goalBlockedEventHandler = new GoalBlockedEventHandler(goalBlockedProjector);
    const goalUnblockedEventHandler = new GoalUnblockedEventHandler(goalUnblockedProjector);
    const goalPausedEventHandler = new GoalPausedEventHandler(goalPausedProjector);
    const goalResumedEventHandler = new GoalResumedEventHandler(goalResumedProjector);
    const goalCompletedEventHandler = new GoalCompletedEventHandler(goalCompletedProjector);
    const goalResetEventHandler = new GoalResetEventHandler(goalResetProjector);
    const goalRemovedEventHandler = new GoalRemovedEventHandler(goalRemovedProjector);
    const goalProgressUpdatedEventHandler = new GoalProgressUpdatedEventHandler(goalProgressUpdatedProjector);
    const goalSubmittedForReviewEventHandler = new GoalSubmittedForReviewEventHandler(goalSubmittedForReviewProjector);
    const goalQualifiedEventHandler = new GoalQualifiedEventHandler(goalQualifiedProjector);

    // Solution Category
    // Architecture Event Handlers - decomposed by use case
    const architectureDefinedEventHandler = new ArchitectureDefinedEventHandler(architectureDefinedProjector);
    const architectureUpdatedEventHandler = new ArchitectureUpdatedEventHandler(architectureUpdatedProjector);
    // Component Event Handlers - decomposed by use case
    const componentAddedEventHandler = new ComponentAddedEventHandler(componentAddedProjector);
    const componentUpdatedEventHandler = new ComponentUpdatedEventHandler(componentUpdatedProjector);
    const componentDeprecatedEventHandler = new ComponentDeprecatedEventHandler(componentDeprecatedProjector);
    const componentRemovedEventHandler = new ComponentRemovedEventHandler(componentRemovedProjector);
    // Dependency Event Handlers - decomposed by use case
    const dependencyAddedEventHandler = new DependencyAddedEventHandler(dependencyAddedProjector);
    const dependencyUpdatedEventHandler = new DependencyUpdatedEventHandler(dependencyUpdatedProjector);
    const dependencyRemovedEventHandler = new DependencyRemovedEventHandler(dependencyRemovedProjector);
    // Decision Event Handlers - decomposed by use case
    const decisionAddedEventHandler = new DecisionAddedEventHandler(decisionAddedProjector);
    const decisionUpdatedEventHandler = new DecisionUpdatedEventHandler(decisionUpdatedProjector);
    const decisionReversedEventHandler = new DecisionReversedEventHandler(decisionReversedProjector);
    const decisionSupersededEventHandler = new DecisionSupersededEventHandler(decisionSupersededProjector);
    // Guideline Event Handlers - decomposed by use case
    const guidelineAddedEventHandler = new GuidelineAddedEventHandler(guidelineAddedProjector);
    const guidelineUpdatedEventHandler = new GuidelineUpdatedEventHandler(guidelineUpdatedProjector);
    const guidelineRemovedEventHandler = new GuidelineRemovedEventHandler(guidelineRemovedProjector);
    // Invariant Event Handlers - decomposed by use case
    const invariantAddedEventHandler = new InvariantAddedEventHandler(invariantAddedProjector);
    const invariantUpdatedEventHandler = new InvariantUpdatedEventHandler(invariantUpdatedProjector);
    const invariantRemovedEventHandler = new InvariantRemovedEventHandler(invariantRemovedProjector);

    // Project Knowledge Category
    // Project Event Handlers - decomposed by use case
    const projectInitializedEventHandler = new ProjectInitializedEventHandler(projectInitializedProjector);
    const projectUpdatedEventHandler = new ProjectUpdatedEventHandler(projectUpdatedProjector);
    // AudiencePain Event Handlers - decomposed by use case
    const audiencePainAddedEventHandler = new AudiencePainAddedEventHandler(audiencePainAddedProjector);
    const audiencePainUpdatedEventHandler = new AudiencePainUpdatedEventHandler(audiencePainUpdatedProjector);
    const audiencePainResolvedEventHandler = new AudiencePainResolvedEventHandler(audiencePainResolvedProjector);
    // Audience Event Handlers - decomposed by use case
    const audienceAddedEventHandler = new AudienceAddedEventHandler(audienceAddedProjector);
    const audienceUpdatedEventHandler = new AudienceUpdatedEventHandler(audienceUpdatedProjector);
    const audienceRemovedEventHandler = new AudienceRemovedEventHandler(audienceRemovedProjector);
    // ValueProposition Event Handlers - decomposed by use case
    const valuePropositionAddedEventHandler = new ValuePropositionAddedEventHandler(valuePropositionAddedProjector);
    const valuePropositionUpdatedEventHandler = new ValuePropositionUpdatedEventHandler(valuePropositionUpdatedProjector);
    const valuePropositionRemovedEventHandler = new ValuePropositionRemovedEventHandler(valuePropositionRemovedProjector);

    // Relations Category - Event Handlers - decomposed by use case
    const relationAddedEventHandler = new RelationAddedEventHandler(relationAddedProjector);
    const relationRemovedEventHandler = new RelationRemovedEventHandler(relationRemovedProjector);

    // ============================================================
    // STEP 6: Subscribe Projection Handlers to Events
    // ============================================================

    // Work Category - Session events
    eventBus.subscribe("SessionStartedEvent", sessionStartedEventHandler);
    eventBus.subscribe("SessionEndedEvent", sessionEndedEventHandler);

    // Work Category - Session Summary (cross-aggregate projection)
    sessionSummaryProjectionHandler.subscribe();

    // Work Category - Goal events
    eventBus.subscribe("GoalAddedEvent", goalAddedEventHandler);
    eventBus.subscribe("GoalStartedEvent", goalStartedEventHandler);
    eventBus.subscribe("GoalUpdatedEvent", goalUpdatedEventHandler);
    eventBus.subscribe("GoalBlockedEvent", goalBlockedEventHandler);
    eventBus.subscribe("GoalUnblockedEvent", goalUnblockedEventHandler);
    eventBus.subscribe("GoalPausedEvent", goalPausedEventHandler);
    eventBus.subscribe("GoalResumedEvent", goalResumedEventHandler);
    eventBus.subscribe("GoalCompletedEvent", goalCompletedEventHandler);
    eventBus.subscribe("GoalResetEvent", goalResetEventHandler);
    eventBus.subscribe("GoalRemovedEvent", goalRemovedEventHandler);
    eventBus.subscribe("GoalProgressUpdatedEvent", goalProgressUpdatedEventHandler);
    eventBus.subscribe("GoalSubmittedForReviewEvent", goalSubmittedForReviewEventHandler);
    eventBus.subscribe("GoalQualifiedEvent", goalQualifiedEventHandler);

    // Solution Category - Architecture events - decomposed by use case
    eventBus.subscribe("ArchitectureDefinedEvent", architectureDefinedEventHandler);
    eventBus.subscribe("ArchitectureUpdatedEvent", architectureUpdatedEventHandler);

    // Solution Category - Component events - decomposed by use case
    eventBus.subscribe("ComponentAddedEvent", componentAddedEventHandler);
    eventBus.subscribe("ComponentUpdatedEvent", componentUpdatedEventHandler);
    eventBus.subscribe("ComponentDeprecatedEvent", componentDeprecatedEventHandler);
    eventBus.subscribe("ComponentRemovedEvent", componentRemovedEventHandler);

    // Solution Category - Dependency events - decomposed by use case
    eventBus.subscribe("DependencyAddedEvent", dependencyAddedEventHandler);
    eventBus.subscribe("DependencyUpdatedEvent", dependencyUpdatedEventHandler);
    eventBus.subscribe("DependencyRemovedEvent", dependencyRemovedEventHandler);

    // Solution Category - Decision events - decomposed by use case
    eventBus.subscribe("DecisionAddedEvent", decisionAddedEventHandler);
    eventBus.subscribe("DecisionUpdatedEvent", decisionUpdatedEventHandler);
    eventBus.subscribe("DecisionReversedEvent", decisionReversedEventHandler);
    eventBus.subscribe("DecisionSupersededEvent", decisionSupersededEventHandler);

    // Solution Category - Guideline events - decomposed by use case
    eventBus.subscribe("GuidelineAddedEvent", guidelineAddedEventHandler);
    eventBus.subscribe("GuidelineUpdatedEvent", guidelineUpdatedEventHandler);
    eventBus.subscribe("GuidelineRemovedEvent", guidelineRemovedEventHandler);

    // Solution Category - Invariant events - decomposed by use case
    eventBus.subscribe("InvariantAddedEvent", invariantAddedEventHandler);
    eventBus.subscribe("InvariantUpdatedEvent", invariantUpdatedEventHandler);
    eventBus.subscribe("InvariantRemovedEvent", invariantRemovedEventHandler);

    // Project Knowledge Category - Project events - decomposed by use case
    eventBus.subscribe("ProjectInitializedEvent", projectInitializedEventHandler);
    eventBus.subscribe("ProjectUpdatedEvent", projectUpdatedEventHandler);

    // Project Knowledge Category - Audience Pain events - decomposed by use case
    eventBus.subscribe("AudiencePainAddedEvent", audiencePainAddedEventHandler);
    eventBus.subscribe("AudiencePainUpdatedEvent", audiencePainUpdatedEventHandler);
    eventBus.subscribe("AudiencePainResolvedEvent", audiencePainResolvedEventHandler);

    // Project Knowledge Category - Audience events - decomposed by use case
    eventBus.subscribe("AudienceAddedEvent", audienceAddedEventHandler);
    eventBus.subscribe("AudienceUpdatedEvent", audienceUpdatedEventHandler);
    eventBus.subscribe("AudienceRemovedEvent", audienceRemovedEventHandler);

    // Project Knowledge Category - Value Proposition events - decomposed by use case
    eventBus.subscribe("ValuePropositionAddedEvent", valuePropositionAddedEventHandler);
    eventBus.subscribe("ValuePropositionUpdatedEvent", valuePropositionUpdatedEventHandler);
    eventBus.subscribe("ValuePropositionRemovedEvent", valuePropositionRemovedEventHandler);

    // Relations Category - Relation events - decomposed by use case
    eventBus.subscribe("RelationAddedEvent", relationAddedEventHandler);
    eventBus.subscribe("RelationRemovedEvent", relationRemovedEventHandler);

    // ============================================================
    // STEP 7: Return Complete Container (No Lifecycle Management)
    // ============================================================

    return {
      // Core Infrastructure
      eventBus,
      eventStore,
      clock,
      settingsReader,
      settingsInitializer,

      // Worker Identity
      workerIdentityReader,

      // Goal Claims
      goalClaimPolicy,

      // Maintenance Services
      databaseRebuildService,

      // CLI Version
      cliVersionReader,

      // Work Category - Session Event Stores - decomposed by use case
      sessionStartedEventStore,
      sessionEndedEventStore,
      // Goal Event Stores - decomposed by use case
      goalAddedEventStore,
      goalStartedEventStore,
      goalUpdatedEventStore,
      goalBlockedEventStore,
      goalUnblockedEventStore,
      goalPausedEventStore,
      goalResumedEventStore,
      goalCompletedEventStore,
      goalResetEventStore,
      goalRemovedEventStore,
      goalProgressUpdatedEventStore,
      goalSubmittedForReviewEventStore,
      goalQualifiedEventStore,
      // Session Projection Stores - decomposed by use case
      sessionStartedProjector,
      sessionEndedProjector,
      activeSessionReader,
      sessionSummaryProjectionStore,
      sessionSummaryReader,
      sessionListReader,
      // Goal Projection Stores - decomposed by use case
      goalAddedProjector,
      goalStartedProjector,
      goalUpdatedProjector,
      goalBlockedProjector,
      goalUnblockedProjector,
      goalPausedProjector,
      goalResumedProjector,
      goalCompletedProjector,
      goalResetProjector,
      goalRemovedProjector,
      goalProgressUpdatedProjector,
      goalContextReader,
      goalStatusReader,
      // Goal Controllers
      completeGoalController,
      reviewGoalController,
      qualifyGoalController,

      // Solution Category
      // Architecture Event Stores - decomposed by use case
      architectureDefinedEventStore,
      architectureUpdatedEventStore,
      // Component Event Stores - decomposed by use case
      componentAddedEventStore,
      componentUpdatedEventStore,
      componentDeprecatedEventStore,
      componentRemovedEventStore,
      // Dependency Event Stores - decomposed by use case
      dependencyAddedEventStore,
      dependencyUpdatedEventStore,
      dependencyRemovedEventStore,
      // Decision Event Stores - decomposed by use case
      decisionAddedEventStore,
      decisionUpdatedEventStore,
      decisionReversedEventStore,
      decisionSupersededEventStore,
      // Guideline Event Stores - decomposed by use case
      guidelineAddedEventStore,
      guidelineUpdatedEventStore,
      guidelineRemovedEventStore,
      // Invariant Event Stores - decomposed by use case
      invariantAddedEventStore,
      invariantUpdatedEventStore,
      invariantRemovedEventStore,
      // Architecture Projection Stores - decomposed by use case
      architectureDefinedProjector,
      architectureUpdatedProjector,
      architectureReader,
      architectureViewer,
      // Component Projection Stores - decomposed by use case
      componentAddedProjector,
      componentUpdatedProjector,
      componentDeprecatedProjector,
      componentRemovedProjector,
      componentContextReader,
      componentListReader,
      // Dependency Projection Stores - decomposed by use case
      dependencyAddedProjector,
      dependencyUpdatedProjector,
      dependencyRemovedProjector,
      dependencyContextReader,
      dependencyListReader,
      // Decision Projection Stores - decomposed by use case
      decisionAddedProjector,
      decisionUpdatedProjector,
      decisionReversedProjector,
      decisionSupersededProjector,
      decisionContextReader,
      decisionSessionReader,
      decisionListReader,
      // Guideline Projection Stores - decomposed by use case
      guidelineAddedProjector,
      guidelineUpdatedProjector,
      guidelineRemovedProjector,
      guidelineContextReader,
      guidelineListReader,
      // Invariant Projection Stores - decomposed by use case
      invariantAddedProjector,
      invariantUpdatedProjector,
      invariantRemovedProjector,
      invariantContextReader,
      invariantListReader,
      // Solution Context - cross-cutting reader and qualifier
      solutionContextReader,
      unprimedBrownfieldQualifier,

      // Project Knowledge Category
      // Project Event Stores - decomposed by use case
      projectInitializedEventStore,
      projectUpdatedEventStore,
      // Project Services
      agentFileProtocol,
      initializationProtocol,
      // Audience Event Stores - decomposed by use case
      audienceAddedEventStore,
      audienceUpdatedEventStore,
      audienceRemovedEventStore,
      // AudiencePain Event Stores - decomposed by use case
      audiencePainAddedEventStore,
      audiencePainUpdatedEventStore,
      audiencePainResolvedEventStore,
      // ValueProposition Event Stores - decomposed by use case
      valuePropositionAddedEventStore,
      valuePropositionUpdatedEventStore,
      valuePropositionRemovedEventStore,
      // Project Projection Stores - decomposed by use case
      projectInitializedProjector,
      projectUpdatedProjector,
      projectContextReader,
      // Audience Projection Stores - decomposed by use case
      audienceAddedProjector,
      audienceUpdatedProjector,
      audienceRemovedProjector,
      audienceContextReader,
      // AudiencePain Projection Stores - decomposed by use case
      audiencePainAddedProjector,
      audiencePainUpdatedProjector,
      audiencePainResolvedProjector,
      audiencePainContextReader,
      // ValueProposition Projection Stores - decomposed by use case
      valuePropositionAddedProjector,
      valuePropositionUpdatedProjector,
      valuePropositionRemovedProjector,
      valuePropositionContextReader,

      // Relations Category - decomposed by use case
      relationAddedEventStore,
      relationRemovedEventStore,
      relationAddedProjector,
      relationRemovedProjector,
      relationListReader,
    };
  }
}
