/**
 * TEMPORARY WORKAROUND - DO NOT USE IN PRODUCTION
 *
 * Infrastructure implementation of database rebuild service with sequential handler execution.
 *
 * This service addresses a race condition during database rebuild where
 * cross-aggregate projection handlers
 * attempt to read from projections (e.g., goal_views) while primary handlers
 * are still writing to them.
 *
 * The root cause: InProcessEventBus executes handlers in parallel via Promise.all(),
 * which works fine during normal operations but causes issues during rebuild when
 * projections don't exist yet.
 *
 * This service encapsulates ALL the complexity of sequential rebuild:
 * - Creating new database connection
 * - Running migrations
 * - Creating sequential event bus
 * - Creating all projectors
 * - Creating all handlers
 * - Registering handlers
 * - Replaying events sequentially
 *
 * REMOVAL PLAN:
 * This will be removed when Epic/Feature/Task redesign is complete. At that time,
 * simply swap back to LocalDatabaseRebuildService in bootstrap.ts.
 *
 * @see LocalDatabaseRebuildService - Normal parallel rebuild (currently has race condition)
 */

import fs from "fs-extra";
import path from "path";
import Database from "better-sqlite3";
import {
  IDatabaseRebuildService,
  DatabaseRebuildResult,
} from "../../application/maintenance/db/rebuild/IDatabaseRebuildService.js";
import { IEventStore } from "../../application/persistence/IEventStore.js";
import { TemporarySequentialRebuildEventBus } from "../messaging/TemporarySequentialRebuildEventBus.js";
import { MigrationRunner } from "../persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../persistence/migrations.config.js";

// Projectors
import { SqliteSessionStartedProjector } from "../context/sessions/start/SqliteSessionStartedProjector.js";
import { SqliteSessionEndedProjector } from "../context/sessions/end/SqliteSessionEndedProjector.js";
import { SqliteGoalAddedProjector } from "../context/goals/add/SqliteGoalAddedProjector.js";
import { SqliteGoalStartedProjector } from "../context/goals/start/SqliteGoalStartedProjector.js";
import { SqliteGoalUpdatedProjector } from "../context/goals/update/SqliteGoalUpdatedProjector.js";
import { SqliteGoalBlockedProjector } from "../context/goals/block/SqliteGoalBlockedProjector.js";
import { SqliteGoalUnblockedProjector } from "../context/goals/unblock/SqliteGoalUnblockedProjector.js";
import { SqliteGoalPausedProjector } from "../context/goals/pause/SqliteGoalPausedProjector.js";
import { SqliteGoalResumedProjector } from "../context/goals/resume/SqliteGoalResumedProjector.js";
import { SqliteGoalCompletedProjector } from "../context/goals/complete/SqliteGoalCompletedProjector.js";
import { SqliteGoalResetProjector } from "../context/goals/reset/SqliteGoalResetProjector.js";
import { SqliteGoalRemovedProjector } from "../context/goals/remove/SqliteGoalRemovedProjector.js";
import { SqliteGoalRefinedProjector } from "../context/goals/refine/SqliteGoalRefinedProjector.js";
import { SqliteGoalProgressUpdatedProjector } from "../context/goals/update-progress/SqliteGoalProgressUpdatedProjector.js";
import { SqliteGoalSubmittedForReviewProjector } from "../context/goals/review/SqliteGoalSubmittedForReviewProjector.js";
import { SqliteGoalQualifiedProjector } from "../context/goals/qualify/SqliteGoalQualifiedProjector.js";
import { SqliteArchitectureDefinedProjector } from "../context/architecture/define/SqliteArchitectureDefinedProjector.js";
import { SqliteArchitectureUpdatedProjector } from "../context/architecture/update/SqliteArchitectureUpdatedProjector.js";
import { SqliteComponentAddedProjector } from "../context/components/add/SqliteComponentAddedProjector.js";
import { SqliteComponentUpdatedProjector } from "../context/components/update/SqliteComponentUpdatedProjector.js";
import { SqliteComponentDeprecatedProjector } from "../context/components/deprecate/SqliteComponentDeprecatedProjector.js";
import { SqliteComponentRemovedProjector } from "../context/components/remove/SqliteComponentRemovedProjector.js";
import { SqliteDependencyAddedProjector } from "../context/dependencies/add/SqliteDependencyAddedProjector.js";
import { SqliteDependencyUpdatedProjector } from "../context/dependencies/update/SqliteDependencyUpdatedProjector.js";
import { SqliteDependencyRemovedProjector } from "../context/dependencies/remove/SqliteDependencyRemovedProjector.js";
import { SqliteDecisionAddedProjector } from "../context/decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionUpdatedProjector } from "../context/decisions/update/SqliteDecisionUpdatedProjector.js";
import { SqliteDecisionReversedProjector } from "../context/decisions/reverse/SqliteDecisionReversedProjector.js";
import { SqliteDecisionSupersededProjector } from "../context/decisions/supersede/SqliteDecisionSupersededProjector.js";
import { SqliteGuidelineAddedProjector } from "../context/guidelines/add/SqliteGuidelineAddedProjector.js";
import { SqliteGuidelineUpdatedProjector } from "../context/guidelines/update/SqliteGuidelineUpdatedProjector.js";
import { SqliteGuidelineRemovedProjector } from "../context/guidelines/remove/SqliteGuidelineRemovedProjector.js";
import { SqliteInvariantAddedProjector } from "../context/invariants/add/SqliteInvariantAddedProjector.js";
import { SqliteInvariantUpdatedProjector } from "../context/invariants/update/SqliteInvariantUpdatedProjector.js";
import { SqliteInvariantRemovedProjector } from "../context/invariants/remove/SqliteInvariantRemovedProjector.js";
import { SqliteProjectInitializedProjector } from "../context/project/init/SqliteProjectInitializedProjector.js";
import { SqliteProjectUpdatedProjector } from "../context/project/update/SqliteProjectUpdatedProjector.js";
import { SqliteAudiencePainAddedProjector } from "../context/audience-pains/add/SqliteAudiencePainAddedProjector.js";
import { SqliteAudiencePainUpdatedProjector } from "../context/audience-pains/update/SqliteAudiencePainUpdatedProjector.js";
import { SqliteAudienceAddedProjector } from "../context/audiences/add/SqliteAudienceAddedProjector.js";
import { SqliteAudienceUpdatedProjector } from "../context/audiences/update/SqliteAudienceUpdatedProjector.js";
import { SqliteAudienceRemovedProjector } from "../context/audiences/remove/SqliteAudienceRemovedProjector.js";
import { SqliteValuePropositionAddedProjector } from "../context/value-propositions/add/SqliteValuePropositionAddedProjector.js";
import { SqliteValuePropositionUpdatedProjector } from "../context/value-propositions/update/SqliteValuePropositionUpdatedProjector.js";
import { SqliteValuePropositionRemovedProjector } from "../context/value-propositions/remove/SqliteValuePropositionRemovedProjector.js";
import { SqliteRelationAddedProjector } from "../context/relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationRemovedProjector } from "../context/relations/remove/SqliteRelationRemovedProjector.js";

// Handlers
import { SessionStartedEventHandler } from "../../application/context/sessions/start/SessionStartedEventHandler.js";
import { SessionEndedEventHandler } from "../../application/context/sessions/end/SessionEndedEventHandler.js";
import { GoalAddedEventHandler } from "../../application/context/goals/add/GoalAddedEventHandler.js";
import { GoalStartedEventHandler } from "../../application/context/goals/start/GoalStartedEventHandler.js";
import { GoalUpdatedEventHandler } from "../../application/context/goals/update/GoalUpdatedEventHandler.js";
import { GoalBlockedEventHandler } from "../../application/context/goals/block/GoalBlockedEventHandler.js";
import { GoalUnblockedEventHandler } from "../../application/context/goals/unblock/GoalUnblockedEventHandler.js";
import { GoalPausedEventHandler } from "../../application/context/goals/pause/GoalPausedEventHandler.js";
import { GoalResumedEventHandler } from "../../application/context/goals/resume/GoalResumedEventHandler.js";
import { GoalCompletedEventHandler } from "../../application/context/goals/complete/GoalCompletedEventHandler.js";
import { GoalResetEventHandler } from "../../application/context/goals/reset/GoalResetEventHandler.js";
import { GoalRemovedEventHandler } from "../../application/context/goals/remove/GoalRemovedEventHandler.js";
import { GoalRefinedEventHandler } from "../../application/context/goals/refine/GoalRefinedEventHandler.js";
import { GoalProgressUpdatedEventHandler } from "../../application/context/goals/update-progress/GoalProgressUpdatedEventHandler.js";
import { GoalSubmittedForReviewEventHandler } from "../../application/context/goals/review/GoalSubmittedForReviewEventHandler.js";
import { GoalQualifiedEventHandler } from "../../application/context/goals/qualify/GoalQualifiedEventHandler.js";
import { DecisionAddedEventHandler } from "../../application/context/decisions/add/DecisionAddedEventHandler.js";
import { DecisionUpdatedEventHandler } from "../../application/context/decisions/update/DecisionUpdatedEventHandler.js";
import { DecisionReversedEventHandler } from "../../application/context/decisions/reverse/DecisionReversedEventHandler.js";
import { DecisionSupersededEventHandler } from "../../application/context/decisions/supersede/DecisionSupersededEventHandler.js";
import { ArchitectureDefinedEventHandler } from "../../application/context/architecture/define/ArchitectureDefinedEventHandler.js";
import { ArchitectureUpdatedEventHandler } from "../../application/context/architecture/update/ArchitectureUpdatedEventHandler.js";
import { ComponentAddedEventHandler } from "../../application/context/components/add/ComponentAddedEventHandler.js";
import { ComponentUpdatedEventHandler } from "../../application/context/components/update/ComponentUpdatedEventHandler.js";
import { ComponentDeprecatedEventHandler } from "../../application/context/components/deprecate/ComponentDeprecatedEventHandler.js";
import { ComponentRemovedEventHandler } from "../../application/context/components/remove/ComponentRemovedEventHandler.js";
import { DependencyAddedEventHandler } from "../../application/context/dependencies/add/DependencyAddedEventHandler.js";
import { DependencyUpdatedEventHandler } from "../../application/context/dependencies/update/DependencyUpdatedEventHandler.js";
import { DependencyRemovedEventHandler } from "../../application/context/dependencies/remove/DependencyRemovedEventHandler.js";
import { GuidelineAddedEventHandler } from "../../application/context/guidelines/add/GuidelineAddedEventHandler.js";
import { GuidelineUpdatedEventHandler } from "../../application/context/guidelines/update/GuidelineUpdatedEventHandler.js";
import { GuidelineRemovedEventHandler } from "../../application/context/guidelines/remove/GuidelineRemovedEventHandler.js";
import { InvariantAddedEventHandler } from "../../application/context/invariants/add/InvariantAddedEventHandler.js";
import { InvariantUpdatedEventHandler } from "../../application/context/invariants/update/InvariantUpdatedEventHandler.js";
import { InvariantRemovedEventHandler } from "../../application/context/invariants/remove/InvariantRemovedEventHandler.js";
import { ProjectInitializedEventHandler } from "../../application/context/project/init/ProjectInitializedEventHandler.js";
import { ProjectUpdatedEventHandler } from "../../application/context/project/update/ProjectUpdatedEventHandler.js";
import { AudiencePainAddedEventHandler } from "../../application/context/audience-pains/add/AudiencePainAddedEventHandler.js";
import { AudiencePainUpdatedEventHandler } from "../../application/context/audience-pains/update/AudiencePainUpdatedEventHandler.js";
import { AudienceAddedEventHandler } from "../../application/context/audiences/add/AudienceAddedEventHandler.js";
import { AudienceUpdatedEventHandler } from "../../application/context/audiences/update/AudienceUpdatedEventHandler.js";
import { AudienceRemovedEventHandler } from "../../application/context/audiences/remove/AudienceRemovedEventHandler.js";
import { ValuePropositionAddedEventHandler } from "../../application/context/value-propositions/add/ValuePropositionAddedEventHandler.js";
import { ValuePropositionUpdatedEventHandler } from "../../application/context/value-propositions/update/ValuePropositionUpdatedEventHandler.js";
import { ValuePropositionRemovedEventHandler } from "../../application/context/value-propositions/remove/ValuePropositionRemovedEventHandler.js";
import { RelationAddedEventHandler } from "../../application/context/relations/add/RelationAddedEventHandler.js";
import { RelationRemovedEventHandler } from "../../application/context/relations/remove/RelationRemovedEventHandler.js";

export class TemporarySequentialDatabaseRebuildService implements IDatabaseRebuildService {
  constructor(
    private readonly rootDir: string,
    private readonly db: Database.Database,
    private readonly eventStore: IEventStore
  ) {}

  async rebuild(): Promise<DatabaseRebuildResult> {
    const dbPath = path.join(this.rootDir, "jumbo.db");

    // Step 1: Close existing database connection
    if (this.db && this.db.open) {
      this.db.pragma("wal_checkpoint(TRUNCATE)");
      this.db.close();
    }

    // Step 2: Delete the database file
    if (await fs.pathExists(dbPath)) {
      await fs.remove(dbPath);
    }

    // Also remove WAL and SHM files if they exist
    const walPath = dbPath + "-wal";
    const shmPath = dbPath + "-shm";
    if (await fs.pathExists(walPath)) {
      await fs.remove(walPath);
    }
    if (await fs.pathExists(shmPath)) {
      await fs.remove(shmPath);
    }

    // Step 3: Create new database connection and run migrations
    const newDb = new Database(dbPath);
    newDb.pragma("journal_mode = WAL");

    const infrastructureDir = path.resolve(__dirname, "..");
    const migrations = getNamespaceMigrations(infrastructureDir);
    const migrationRunner = new MigrationRunner(newDb);
    migrationRunner.runNamespaceMigrations(migrations);

    // Step 4: Create sequential event bus
    const sequentialEventBus = new TemporarySequentialRebuildEventBus();

    // Step 5: Create all projectors
    const sessionStartedProjector = new SqliteSessionStartedProjector(newDb);
    const sessionEndedProjector = new SqliteSessionEndedProjector(newDb);
    const goalAddedProjector = new SqliteGoalAddedProjector(newDb);
    const goalStartedProjector = new SqliteGoalStartedProjector(newDb);
    const goalUpdatedProjector = new SqliteGoalUpdatedProjector(newDb);
    const goalBlockedProjector = new SqliteGoalBlockedProjector(newDb);
    const goalUnblockedProjector = new SqliteGoalUnblockedProjector(newDb);
    const goalPausedProjector = new SqliteGoalPausedProjector(newDb);
    const goalResumedProjector = new SqliteGoalResumedProjector(newDb);
    const goalCompletedProjector = new SqliteGoalCompletedProjector(newDb);
    const goalResetProjector = new SqliteGoalResetProjector(newDb);
    const goalRemovedProjector = new SqliteGoalRemovedProjector(newDb);
    const goalRefinedProjector = new SqliteGoalRefinedProjector(newDb);
    const goalProgressUpdatedProjector = new SqliteGoalProgressUpdatedProjector(newDb);
    const goalSubmittedForReviewProjector = new SqliteGoalSubmittedForReviewProjector(newDb);
    const goalQualifiedProjector = new SqliteGoalQualifiedProjector(newDb);
    const architectureDefinedProjector = new SqliteArchitectureDefinedProjector(newDb);
    const architectureUpdatedProjector = new SqliteArchitectureUpdatedProjector(newDb);
    const componentAddedProjector = new SqliteComponentAddedProjector(newDb);
    const componentUpdatedProjector = new SqliteComponentUpdatedProjector(newDb);
    const componentDeprecatedProjector = new SqliteComponentDeprecatedProjector(newDb);
    const componentRemovedProjector = new SqliteComponentRemovedProjector(newDb);
    const dependencyAddedProjector = new SqliteDependencyAddedProjector(newDb);
    const dependencyUpdatedProjector = new SqliteDependencyUpdatedProjector(newDb);
    const dependencyRemovedProjector = new SqliteDependencyRemovedProjector(newDb);
    const decisionAddedProjector = new SqliteDecisionAddedProjector(newDb);
    const decisionUpdatedProjector = new SqliteDecisionUpdatedProjector(newDb);
    const decisionReversedProjector = new SqliteDecisionReversedProjector(newDb);
    const decisionSupersededProjector = new SqliteDecisionSupersededProjector(newDb);
    const guidelineAddedProjector = new SqliteGuidelineAddedProjector(newDb);
    const guidelineUpdatedProjector = new SqliteGuidelineUpdatedProjector(newDb);
    const guidelineRemovedProjector = new SqliteGuidelineRemovedProjector(newDb);
    const invariantAddedProjector = new SqliteInvariantAddedProjector(newDb);
    const invariantUpdatedProjector = new SqliteInvariantUpdatedProjector(newDb);
    const invariantRemovedProjector = new SqliteInvariantRemovedProjector(newDb);
    const projectInitializedProjector = new SqliteProjectInitializedProjector(newDb);
    const projectUpdatedProjector = new SqliteProjectUpdatedProjector(newDb);
    const audiencePainAddedProjector = new SqliteAudiencePainAddedProjector(newDb);
    const audiencePainUpdatedProjector = new SqliteAudiencePainUpdatedProjector(newDb);
const audienceAddedProjector = new SqliteAudienceAddedProjector(newDb);
    const audienceUpdatedProjector = new SqliteAudienceUpdatedProjector(newDb);
    const audienceRemovedProjector = new SqliteAudienceRemovedProjector(newDb);
    const valuePropositionAddedProjector = new SqliteValuePropositionAddedProjector(newDb);
    const valuePropositionUpdatedProjector = new SqliteValuePropositionUpdatedProjector(newDb);
    const valuePropositionRemovedProjector = new SqliteValuePropositionRemovedProjector(newDb);
    const relationAddedProjector = new SqliteRelationAddedProjector(newDb);
    const relationRemovedProjector = new SqliteRelationRemovedProjector(newDb);

    // Step 6: Create all handlers
    const sessionStartedEventHandler = new SessionStartedEventHandler(sessionStartedProjector);
    const sessionEndedEventHandler = new SessionEndedEventHandler(sessionEndedProjector);
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
    const goalRefinedEventHandler = new GoalRefinedEventHandler(goalRefinedProjector);
    const goalProgressUpdatedEventHandler = new GoalProgressUpdatedEventHandler(goalProgressUpdatedProjector);
    const goalSubmittedForReviewEventHandler = new GoalSubmittedForReviewEventHandler(goalSubmittedForReviewProjector);
    const goalQualifiedEventHandler = new GoalQualifiedEventHandler(goalQualifiedProjector);
    const architectureDefinedEventHandler = new ArchitectureDefinedEventHandler(architectureDefinedProjector);
    const architectureUpdatedEventHandler = new ArchitectureUpdatedEventHandler(architectureUpdatedProjector);
    const componentAddedEventHandler = new ComponentAddedEventHandler(componentAddedProjector);
    const componentUpdatedEventHandler = new ComponentUpdatedEventHandler(componentUpdatedProjector);
    const componentDeprecatedEventHandler = new ComponentDeprecatedEventHandler(componentDeprecatedProjector);
    const componentRemovedEventHandler = new ComponentRemovedEventHandler(componentRemovedProjector);
    const dependencyAddedEventHandler = new DependencyAddedEventHandler(dependencyAddedProjector);
    const dependencyUpdatedEventHandler = new DependencyUpdatedEventHandler(dependencyUpdatedProjector);
    const dependencyRemovedEventHandler = new DependencyRemovedEventHandler(dependencyRemovedProjector);
    const decisionAddedEventHandler = new DecisionAddedEventHandler(decisionAddedProjector);
    const decisionUpdatedEventHandler = new DecisionUpdatedEventHandler(decisionUpdatedProjector);
    const decisionReversedEventHandler = new DecisionReversedEventHandler(decisionReversedProjector);
    const decisionSupersededEventHandler = new DecisionSupersededEventHandler(decisionSupersededProjector);
    const guidelineAddedEventHandler = new GuidelineAddedEventHandler(guidelineAddedProjector);
    const guidelineUpdatedEventHandler = new GuidelineUpdatedEventHandler(guidelineUpdatedProjector);
    const guidelineRemovedEventHandler = new GuidelineRemovedEventHandler(guidelineRemovedProjector);
    const invariantAddedEventHandler = new InvariantAddedEventHandler(invariantAddedProjector);
    const invariantUpdatedEventHandler = new InvariantUpdatedEventHandler(invariantUpdatedProjector);
    const invariantRemovedEventHandler = new InvariantRemovedEventHandler(invariantRemovedProjector);
    const projectInitializedEventHandler = new ProjectInitializedEventHandler(projectInitializedProjector);
    const projectUpdatedEventHandler = new ProjectUpdatedEventHandler(projectUpdatedProjector);
    const audiencePainAddedEventHandler = new AudiencePainAddedEventHandler(audiencePainAddedProjector);
    const audiencePainUpdatedEventHandler = new AudiencePainUpdatedEventHandler(audiencePainUpdatedProjector);
const audienceAddedEventHandler = new AudienceAddedEventHandler(audienceAddedProjector);
    const audienceUpdatedEventHandler = new AudienceUpdatedEventHandler(audienceUpdatedProjector);
    const audienceRemovedEventHandler = new AudienceRemovedEventHandler(audienceRemovedProjector);
    const valuePropositionAddedEventHandler = new ValuePropositionAddedEventHandler(valuePropositionAddedProjector);
    const valuePropositionUpdatedEventHandler = new ValuePropositionUpdatedEventHandler(valuePropositionUpdatedProjector);
    const valuePropositionRemovedEventHandler = new ValuePropositionRemovedEventHandler(valuePropositionRemovedProjector);
    const relationAddedEventHandler = new RelationAddedEventHandler(relationAddedProjector);
    const relationRemovedEventHandler = new RelationRemovedEventHandler(relationRemovedProjector);

    // Step 7: Register all handlers to sequential bus
    sequentialEventBus.subscribe("SessionStartedEvent", sessionStartedEventHandler);
    sequentialEventBus.subscribe("SessionEndedEvent", sessionEndedEventHandler);
    sequentialEventBus.subscribe("GoalAddedEvent", goalAddedEventHandler);
    sequentialEventBus.subscribe("GoalStartedEvent", goalStartedEventHandler);
    sequentialEventBus.subscribe("GoalUpdatedEvent", goalUpdatedEventHandler);
    sequentialEventBus.subscribe("GoalBlockedEvent", goalBlockedEventHandler);
    sequentialEventBus.subscribe("GoalUnblockedEvent", goalUnblockedEventHandler);
    sequentialEventBus.subscribe("GoalPausedEvent", goalPausedEventHandler);
    sequentialEventBus.subscribe("GoalResumedEvent", goalResumedEventHandler);
    sequentialEventBus.subscribe("GoalCompletedEvent", goalCompletedEventHandler);
    sequentialEventBus.subscribe("GoalResetEvent", goalResetEventHandler);
    sequentialEventBus.subscribe("GoalRemovedEvent", goalRemovedEventHandler);
    sequentialEventBus.subscribe("GoalRefinedEvent", goalRefinedEventHandler);
    sequentialEventBus.subscribe("GoalProgressUpdatedEvent", goalProgressUpdatedEventHandler);
    sequentialEventBus.subscribe("GoalSubmittedForReviewEvent", goalSubmittedForReviewEventHandler);
    sequentialEventBus.subscribe("GoalQualifiedEvent", goalQualifiedEventHandler);
    sequentialEventBus.subscribe("ArchitectureDefinedEvent", architectureDefinedEventHandler);
    sequentialEventBus.subscribe("ArchitectureUpdatedEvent", architectureUpdatedEventHandler);
    sequentialEventBus.subscribe("ComponentAddedEvent", componentAddedEventHandler);
    sequentialEventBus.subscribe("ComponentUpdatedEvent", componentUpdatedEventHandler);
    sequentialEventBus.subscribe("ComponentDeprecatedEvent", componentDeprecatedEventHandler);
    sequentialEventBus.subscribe("ComponentRemovedEvent", componentRemovedEventHandler);
    sequentialEventBus.subscribe("DependencyAddedEvent", dependencyAddedEventHandler);
    sequentialEventBus.subscribe("DependencyUpdatedEvent", dependencyUpdatedEventHandler);
    sequentialEventBus.subscribe("DependencyRemovedEvent", dependencyRemovedEventHandler);
    sequentialEventBus.subscribe("DecisionAddedEvent", decisionAddedEventHandler);
    sequentialEventBus.subscribe("DecisionUpdatedEvent", decisionUpdatedEventHandler);
    sequentialEventBus.subscribe("DecisionReversedEvent", decisionReversedEventHandler);
    sequentialEventBus.subscribe("DecisionSupersededEvent", decisionSupersededEventHandler);
    sequentialEventBus.subscribe("GuidelineAddedEvent", guidelineAddedEventHandler);
    sequentialEventBus.subscribe("GuidelineUpdatedEvent", guidelineUpdatedEventHandler);
    sequentialEventBus.subscribe("GuidelineRemovedEvent", guidelineRemovedEventHandler);
    sequentialEventBus.subscribe("InvariantAddedEvent", invariantAddedEventHandler);
    sequentialEventBus.subscribe("InvariantUpdatedEvent", invariantUpdatedEventHandler);
    sequentialEventBus.subscribe("InvariantRemovedEvent", invariantRemovedEventHandler);
    sequentialEventBus.subscribe("ProjectInitializedEvent", projectInitializedEventHandler);
    sequentialEventBus.subscribe("ProjectUpdatedEvent", projectUpdatedEventHandler);
    sequentialEventBus.subscribe("AudiencePainAddedEvent", audiencePainAddedEventHandler);
    sequentialEventBus.subscribe("AudiencePainUpdatedEvent", audiencePainUpdatedEventHandler);
sequentialEventBus.subscribe("AudienceAddedEvent", audienceAddedEventHandler);
    sequentialEventBus.subscribe("AudienceUpdatedEvent", audienceUpdatedEventHandler);
    sequentialEventBus.subscribe("AudienceRemovedEvent", audienceRemovedEventHandler);
    sequentialEventBus.subscribe("ValuePropositionAddedEvent", valuePropositionAddedEventHandler);
    sequentialEventBus.subscribe("ValuePropositionUpdatedEvent", valuePropositionUpdatedEventHandler);
    sequentialEventBus.subscribe("ValuePropositionRemovedEvent", valuePropositionRemovedEventHandler);
    sequentialEventBus.subscribe("RelationAddedEvent", relationAddedEventHandler);
    sequentialEventBus.subscribe("RelationRemovedEvent", relationRemovedEventHandler);

    // Step 8: Get all events from event store (file-based, still intact)
    const events = await this.eventStore.getAllEvents();

    // Step 9: Replay each event through the sequential event bus
    let processedCount = 0;
    for (const event of events) {
      await sequentialEventBus.publish(event);
      processedCount++;
    }

    // Step 10: Close the new database connection
    if (newDb && newDb.open) {
      newDb.pragma("wal_checkpoint(TRUNCATE)");
      newDb.close();
    }

    return {
      eventsReplayed: processedCount,
      success: true,
    };
  }
}
