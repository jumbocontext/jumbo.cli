/**
 * Application Container Interface
 *
 * Defines the services available to the presentation layer.
 * All types are interfaces - no concrete implementations exposed.
 *
 * This interface lives in the application layer to ensure the presentation
 * layer only depends on abstractions, not concrete infrastructure types.
 *
 * Key Design:
 * - NO db: Database.Database - database is hidden in infrastructure
 * - NO lifecycle methods - resources managed by Host via signal handlers
 * - Pure dependency access interface
 */

import { IEventStore } from "../persistence/IEventStore.js";
import { IEventBus } from "../messaging/IEventBus.js";
import { IClock } from "../time-and-date/IClock.js";
import { IDatabaseRebuildService } from "../maintenance/db/rebuild/IDatabaseRebuildService.js";

// Settings
import { ISettingsReader } from "../settings/ISettingsReader.js";
import { ISettingsInitializer } from "../settings/ISettingsInitializer.js";

// CLI Version
import { ICliVersionReader } from "../cli-metadata/query/ICliMetadataReader.js";

// Port interfaces for session projection stores - decomposed by use case
import { ISessionStartedProjector } from "../sessions/start/ISessionStartedProjector.js";
import { ISessionEndedProjector } from "../sessions/end/ISessionEndedProjector.js";
import { IActiveSessionReader } from "../sessions/end/IActiveSessionReader.js";
import { ISessionListReader } from "../sessions/list/ISessionListReader.js";
import { ISessionSummaryProjectionStore } from "../sessions/get-context/ISessionSummaryProjectionStore.js";
import { ISessionSummaryReader } from "../sessions/get-context/ISessionSummaryReader.js";
import { IGoalAddedProjector } from "../goals/add/IGoalAddedProjector.js";
import { IGoalStartedProjector } from "../goals/start/IGoalStartedProjector.js";
import { IGoalReader } from "../goals/start/IGoalReader.js";
import { IGoalUpdatedProjector } from "../goals/update/IGoalUpdatedProjector.js";
import { IGoalUpdateReader } from "../goals/update/IGoalUpdateReader.js";
import { IGoalBlockedProjector } from "../goals/block/IGoalBlockedProjector.js";
import { IGoalUnblockedProjector } from "../goals/unblock/IGoalUnblockedProjector.js";
import { IGoalPausedProjector } from "../goals/pause/IGoalPausedProjector.js";
import { IGoalResumedProjector } from "../goals/resume/IGoalResumedProjector.js";
import { IGoalCompletedProjector } from "../goals/complete/IGoalCompletedProjector.js";
import { IGoalCompleteReader } from "../goals/complete/IGoalCompleteReader.js";
import { IGoalRefinedProjector } from "../goals/refine/IGoalRefinedProjector.js";
import { IGoalRefineReader } from "../goals/refine/IGoalRefineReader.js";
import { IGoalResetProjector } from "../goals/reset/IGoalResetProjector.js";
import { IGoalResetReader } from "../goals/reset/IGoalResetReader.js";
import { IGoalRemovedProjector } from "../goals/remove/IGoalRemovedProjector.js";
import { IGoalRemoveReader } from "../goals/remove/IGoalRemoveReader.js";
import { IGoalContextReader } from "../goals/get-context/IGoalContextReader.js";
import { IGoalStatusReader } from "../goals/IGoalStatusReader.js";
import { IGoalReadForSessionSummary } from "../sessions/get-context/IGoalReadForSessionSummary.js";
// Goal Controllers
import { CompleteGoalController } from "../goals/complete/CompleteGoalController.js";
import { ReviewGoalController } from "../goals/review/ReviewGoalController.js";
import { IGoalSubmittedForReviewEventWriter } from "../goals/review/IGoalSubmittedForReviewEventWriter.js";
import { IGoalSubmittedForReviewEventReader } from "../goals/review/IGoalSubmittedForReviewEventReader.js";
import { QualifyGoalController } from "../goals/qualify/QualifyGoalController.js";
import { IGoalQualifiedEventWriter } from "../goals/qualify/IGoalQualifiedEventWriter.js";
import { IGoalQualifiedEventReader } from "../goals/qualify/IGoalQualifiedEventReader.js";

import { IDecisionAddedProjector } from "../decisions/add/IDecisionAddedProjector.js";
import { IDecisionUpdatedProjector } from "../decisions/update/IDecisionUpdatedProjector.js";
import { IDecisionUpdateReader } from "../decisions/update/IDecisionUpdateReader.js";
import { IDecisionReversedProjector } from "../decisions/reverse/IDecisionReversedProjector.js";
import { IDecisionReverseReader } from "../decisions/reverse/IDecisionReverseReader.js";
import { IDecisionSupersededProjector } from "../decisions/supersede/IDecisionSupersededProjector.js";
import { IDecisionSupersedeReader } from "../decisions/supersede/IDecisionSupersedeReader.js";
import { IDecisionContextReader } from "../goals/get-context/IDecisionContextReader.js";
import { IDecisionSessionReader } from "../sessions/get-context/IDecisionSessionReader.js";
import { IDecisionListReader } from "../decisions/list/IDecisionListReader.js";
import { IArchitectureDefinedProjector } from "../architecture/define/IArchitectureDefinedProjector.js";
import { IArchitectureDefineReader } from "../architecture/define/IArchitectureDefineReader.js";
import { IArchitectureUpdatedProjector } from "../architecture/update/IArchitectureUpdatedProjector.js";
import { IArchitectureUpdateReader } from "../architecture/update/IArchitectureUpdateReader.js";
import { IArchitectureReader } from "../architecture/IArchitectureReader.js";
import { IArchitectureViewer } from "../architecture/view/IArchitectureViewer.js";
import { IComponentAddedProjector } from "../components/add/IComponentAddedProjector.js";
import { IComponentAddReader } from "../components/add/IComponentAddReader.js";
import { IComponentUpdatedProjector } from "../components/update/IComponentUpdatedProjector.js";
import { IComponentUpdateReader } from "../components/update/IComponentUpdateReader.js";
import { IComponentDeprecatedProjector } from "../components/deprecate/IComponentDeprecatedProjector.js";
import { IComponentDeprecateReader } from "../components/deprecate/IComponentDeprecateReader.js";
import { IComponentRemovedProjector } from "../components/remove/IComponentRemovedProjector.js";
import { IComponentRemoveReader } from "../components/remove/IComponentRemoveReader.js";
import { IComponentContextReader } from "../goals/get-context/IComponentContextReader.js";
import { IComponentListReader } from "../components/list/IComponentListReader.js";
import { IDependencyAddedProjector } from "../dependencies/add/IDependencyAddedProjector.js";
import { IDependencyAddReader } from "../dependencies/add/IDependencyAddReader.js";
import { IDependencyUpdatedProjector } from "../dependencies/update/IDependencyUpdatedProjector.js";
import { IDependencyUpdateReader } from "../dependencies/update/IDependencyUpdateReader.js";
import { IDependencyRemovedProjector } from "../dependencies/remove/IDependencyRemovedProjector.js";
import { IDependencyRemoveReader } from "../dependencies/remove/IDependencyRemoveReader.js";
import { IDependencyContextReader } from "../goals/get-context/IDependencyContextReader.js";
import { IDependencyListReader } from "../dependencies/list/IDependencyListReader.js";
import { IGuidelineAddedProjector } from "../guidelines/add/IGuidelineAddedProjector.js";
import { IGuidelineUpdatedProjector } from "../guidelines/update/IGuidelineUpdatedProjector.js";
import { IGuidelineUpdateReader } from "../guidelines/update/IGuidelineUpdateReader.js";
import { IGuidelineRemovedProjector } from "../guidelines/remove/IGuidelineRemovedProjector.js";
import { IGuidelineRemoveReader } from "../guidelines/remove/IGuidelineRemoveReader.js";
import { IGuidelineContextReader } from "../goals/get-context/IGuidelineContextReader.js";
import { IGuidelineListReader } from "../guidelines/list/IGuidelineListReader.js";
import { IInvariantAddedProjector } from "../invariants/add/IInvariantAddedProjector.js";
import { IInvariantAddReader } from "../invariants/add/IInvariantAddReader.js";
import { IInvariantUpdatedProjector } from "../invariants/update/IInvariantUpdatedProjector.js";
import { IInvariantUpdateReader } from "../invariants/update/IInvariantUpdateReader.js";
import { IInvariantRemovedProjector } from "../invariants/remove/IInvariantRemovedProjector.js";
import { IInvariantRemoveReader } from "../invariants/remove/IInvariantRemoveReader.js";
import { IInvariantContextReader } from "../goals/get-context/IInvariantContextReader.js";
import { IInvariantListReader } from "../invariants/list/IInvariantListReader.js";
// Relations Projection Store ports - decomposed by use case
import { IRelationAddedProjector } from "../relations/add/IRelationAddedProjector.js";
import { IRelationAddedReader } from "../relations/add/IRelationAddedReader.js";
import { IRelationRemovedProjector } from "../relations/remove/IRelationRemovedProjector.js";
import { IRelationRemovedReader } from "../relations/remove/IRelationRemovedReader.js";
import { IRelationReader } from "../relations/IRelationReader.js";
import { IRelationListReader } from "../relations/list/IRelationListReader.js";
// Audience Pain Projection Store ports - decomposed by use case
import { IAudiencePainAddedProjector } from "../audience-pains/add/IAudiencePainAddedProjector.js";
import { IAudiencePainUpdatedProjector } from "../audience-pains/update/IAudiencePainUpdatedProjector.js";
import { IAudiencePainResolvedProjector } from "../audience-pains/resolve/IAudiencePainResolvedProjector.js";
import { IAudiencePainUpdateReader } from "../audience-pains/update/IAudiencePainUpdateReader.js";
// Audience Projection Store ports - decomposed by use case
import { IAudienceAddedProjector } from "../audiences/add/IAudienceAddedProjector.js";
import { IAudienceUpdatedProjector } from "../audiences/update/IAudienceUpdatedProjector.js";
import { IAudienceRemovedProjector } from "../audiences/remove/IAudienceRemovedProjector.js";
import { IAudienceRemoveReader } from "../audiences/remove/IAudienceRemoveReader.js";
// Value Proposition Projection Store ports - decomposed by use case
import { IValuePropositionAddedProjector } from "../value-propositions/add/IValuePropositionAddedProjector.js";
import { IValuePropositionUpdatedProjector } from "../value-propositions/update/IValuePropositionUpdatedProjector.js";
import { IValuePropositionRemovedProjector } from "../value-propositions/remove/IValuePropositionRemovedProjector.js";
import { IValuePropositionUpdateReader } from "../value-propositions/update/IValuePropositionUpdateReader.js";
import { IValuePropositionRemoveReader } from "../value-propositions/remove/IValuePropositionRemoveReader.js";
import { IProjectInitializedProjector } from "../project/init/IProjectInitializedProjector.js";
import { IProjectUpdatedProjector } from "../project/update/IProjectUpdatedProjector.js";
import { IProjectInitReader } from "../project/init/IProjectInitReader.js";
import { IProjectUpdateReader } from "../project/update/IProjectUpdateReader.js";
import { IProjectContextReader } from "../project/query/IProjectContextReader.js";
import { IProjectInitializedEventWriter } from "../project/init/IProjectInitializedEventWriter.js";
import { IProjectUpdatedEventWriter } from "../project/update/IProjectUpdatedEventWriter.js";
import { IAgentFileProtocol } from "../project/init/IAgentFileProtocol.js";
import { IInitializationProtocol } from "../project/init/IInitializationProtocol.js";
import { IAudienceContextReader } from "../audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../audience-pains/query/IAudiencePainContextReader.js";
import { IValuePropositionContextReader } from "../value-propositions/query/IValuePropositionContextReader.js";
// Solution Context
import { ISolutionContextReader } from "../ISolutionContextReader.js";
import { UnprimedBrownfieldQualifier } from "../UnprimedBrownfieldQualifier.js";

// Worker Identity
import { IWorkerIdentityReader } from "./workers/IWorkerIdentityReader.js";

// Goal Claims
import { GoalClaimPolicy } from "../goals/claims/GoalClaimPolicy.js";

// Port interfaces for session event stores - decomposed by use case
import { ISessionStartedEventWriter } from "../sessions/start/ISessionStartedEventWriter.js";
import { ISessionEndedEventWriter } from "../sessions/end/ISessionEndedEventWriter.js";
import { ISessionEndedEventReader } from "../sessions/end/ISessionEndedEventReader.js";
// Goal Event Store ports - decomposed by use case
import { IGoalAddedEventWriter } from "../goals/add/IGoalAddedEventWriter.js";
import { IGoalStartedEventWriter } from "../goals/start/IGoalStartedEventWriter.js";
import { IGoalStartedEventReader } from "../goals/start/IGoalStartedEventReader.js";
import { IGoalUpdatedEventWriter } from "../goals/update/IGoalUpdatedEventWriter.js";
import { IGoalUpdatedEventReader } from "../goals/update/IGoalUpdatedEventReader.js";
import { IGoalBlockedEventWriter } from "../goals/block/IGoalBlockedEventWriter.js";
import { IGoalBlockedEventReader } from "../goals/block/IGoalBlockedEventReader.js";
import { IGoalUnblockedEventWriter } from "../goals/unblock/IGoalUnblockedEventWriter.js";
import { IGoalUnblockedEventReader } from "../goals/unblock/IGoalUnblockedEventReader.js";
import { IGoalPausedEventWriter } from "../goals/pause/IGoalPausedEventWriter.js";
import { IGoalPausedEventReader } from "../goals/pause/IGoalPausedEventReader.js";
import { IGoalResumedEventWriter } from "../goals/resume/IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "../goals/resume/IGoalResumedEventReader.js";
import { IGoalCompletedEventWriter } from "../goals/complete/IGoalCompletedEventWriter.js";
import { IGoalCompletedEventReader } from "../goals/complete/IGoalCompletedEventReader.js";
import { IGoalRefineEventWriter } from "../goals/refine/IGoalRefineEventWriter.js";
import { IGoalRefineEventReader } from "../goals/refine/IGoalRefineEventReader.js";
import { IGoalResetEventWriter } from "../goals/reset/IGoalResetEventWriter.js";
import { IGoalResetEventReader } from "../goals/reset/IGoalResetEventReader.js";
import { IGoalRemovedEventWriter } from "../goals/remove/IGoalRemovedEventWriter.js";
import { IGoalRemovedEventReader } from "../goals/remove/IGoalRemovedEventReader.js";
import { IGoalProgressUpdatedEventWriter } from "../goals/update-progress/IGoalProgressUpdatedEventWriter.js";
import { IGoalProgressUpdatedEventReader } from "../goals/update-progress/IGoalProgressUpdatedEventReader.js";
import { IGoalProgressUpdatedProjector } from "../goals/update-progress/IGoalProgressUpdatedProjector.js";
import { IGoalProgressUpdateReader } from "../goals/update-progress/IGoalProgressUpdateReader.js";
import { IDecisionAddedEventWriter } from "../decisions/add/IDecisionAddedEventWriter.js";
import { IDecisionUpdatedEventWriter } from "../decisions/update/IDecisionUpdatedEventWriter.js";
import { IDecisionReversedEventWriter } from "../decisions/reverse/IDecisionReversedEventWriter.js";
import { IDecisionSupersededEventWriter } from "../decisions/supersede/IDecisionSupersededEventWriter.js";
import { IArchitectureDefinedEventWriter } from "../architecture/define/IArchitectureDefinedEventWriter.js";
import { IArchitectureUpdatedEventWriter } from "../architecture/update/IArchitectureUpdatedEventWriter.js";
import { IArchitectureUpdatedEventReader } from "../architecture/update/IArchitectureUpdatedEventReader.js";
import { IComponentAddedEventWriter } from "../components/add/IComponentAddedEventWriter.js";
import { IComponentUpdatedEventWriter } from "../components/update/IComponentUpdatedEventWriter.js";
import { IComponentDeprecatedEventWriter } from "../components/deprecate/IComponentDeprecatedEventWriter.js";
import { IComponentRemovedEventWriter } from "../components/remove/IComponentRemovedEventWriter.js";
import { IDependencyAddedEventWriter } from "../dependencies/add/IDependencyAddedEventWriter.js";
import { IDependencyUpdatedEventWriter } from "../dependencies/update/IDependencyUpdatedEventWriter.js";
import { IDependencyUpdatedEventReader } from "../dependencies/update/IDependencyUpdatedEventReader.js";
import { IDependencyRemovedEventWriter } from "../dependencies/remove/IDependencyRemovedEventWriter.js";
import { IDependencyRemovedEventReader } from "../dependencies/remove/IDependencyRemovedEventReader.js";
import { IGuidelineAddedEventWriter } from "../guidelines/add/IGuidelineAddedEventWriter.js";
import { IGuidelineUpdatedEventWriter } from "../guidelines/update/IGuidelineUpdatedEventWriter.js";
import { IGuidelineUpdatedEventReader } from "../guidelines/update/IGuidelineUpdatedEventReader.js";
import { IGuidelineRemovedEventWriter } from "../guidelines/remove/IGuidelineRemovedEventWriter.js";
import { IGuidelineRemovedEventReader } from "../guidelines/remove/IGuidelineRemovedEventReader.js";
import { IInvariantAddedEventWriter } from "../invariants/add/IInvariantAddedEventWriter.js";
import { IInvariantUpdatedEventWriter } from "../invariants/update/IInvariantUpdatedEventWriter.js";
import { IInvariantUpdatedEventReader } from "../invariants/update/IInvariantUpdatedEventReader.js";
import { IInvariantRemovedEventWriter } from "../invariants/remove/IInvariantRemovedEventWriter.js";
import { IInvariantRemovedEventReader } from "../invariants/remove/IInvariantRemovedEventReader.js";
import { IAudienceAddedEventWriter } from "../audiences/add/IAudienceAddedEventWriter.js";
import { IAudienceUpdatedEventWriter } from "../audiences/update/IAudienceUpdatedEventWriter.js";
import { IAudienceRemovedEventWriter } from "../audiences/remove/IAudienceRemovedEventWriter.js";
import { IAudiencePainAddedEventWriter } from "../audience-pains/add/IAudiencePainAddedEventWriter.js";
import { IAudiencePainUpdatedEventWriter } from "../audience-pains/update/IAudiencePainUpdatedEventWriter.js";
import { IAudiencePainResolvedEventWriter } from "../audience-pains/resolve/IAudiencePainResolvedEventWriter.js";
import { IValuePropositionAddedEventWriter } from "../value-propositions/add/IValuePropositionAddedEventWriter.js";
import { IValuePropositionUpdatedEventWriter } from "../value-propositions/update/IValuePropositionUpdatedEventWriter.js";
import { IValuePropositionRemovedEventWriter } from "../value-propositions/remove/IValuePropositionRemovedEventWriter.js";
// Relations Event Store ports - decomposed by use case
import { IRelationAddedEventWriter } from "../relations/add/IRelationAddedEventWriter.js";
import { IRelationRemovedEventWriter } from "../relations/remove/IRelationRemovedEventWriter.js";
import { IRelationRemovedEventReader } from "../relations/remove/IRelationRemovedEventReader.js";

/**
 * IApplicationContainer - Complete dependency injection container interface
 *
 * Contains all infrastructure components, event stores, projection stores,
 * and cross-cutting services needed by the application.
 *
 * This container is created by HostBuilder and provides all dependencies
 * to CLI commands and other application components.
 *
 * Key Design:
 * - NO db: Database.Database - concrete DB types hidden in infrastructure
 * - NO lifecycle methods: No dispose(), no cleanup()
 * - Resources managed by Host via process signal handlers
 * - Pure interface for dependency access
 */
export interface IApplicationContainer {
  // Core Infrastructure
  eventBus: IEventBus;
  eventStore: IEventStore;
  clock: IClock;
  settingsReader: ISettingsReader;
  settingsInitializer: ISettingsInitializer;

  // Worker Identity
  workerIdentityReader: IWorkerIdentityReader;

  // Goal Claims
  goalClaimPolicy: GoalClaimPolicy;

  // Maintenance Services
  databaseRebuildService: IDatabaseRebuildService;

  // CLI Version
  cliVersionReader: ICliVersionReader;

  // Work Category - Session Event Stores - decomposed by use case
  sessionStartedEventStore: ISessionStartedEventWriter;
  sessionEndedEventStore: ISessionEndedEventWriter & ISessionEndedEventReader;
  // Goal Event Stores - decomposed by use case
  goalAddedEventStore: IGoalAddedEventWriter;
  goalStartedEventStore: IGoalStartedEventWriter & IGoalStartedEventReader;
  goalUpdatedEventStore: IGoalUpdatedEventWriter & IGoalUpdatedEventReader;
  goalBlockedEventStore: IGoalBlockedEventWriter & IGoalBlockedEventReader;
  goalUnblockedEventStore: IGoalUnblockedEventWriter & IGoalUnblockedEventReader;
  goalPausedEventStore: IGoalPausedEventWriter & IGoalPausedEventReader;
  goalResumedEventStore: IGoalResumedEventWriter & IGoalResumedEventReader;
  goalCompletedEventStore: IGoalCompletedEventWriter & IGoalCompletedEventReader;
  goalRefinedEventStore: IGoalRefineEventWriter & IGoalRefineEventReader;
  goalResetEventStore: IGoalResetEventWriter & IGoalResetEventReader;
  goalRemovedEventStore: IGoalRemovedEventWriter & IGoalRemovedEventReader;
  goalProgressUpdatedEventStore: IGoalProgressUpdatedEventWriter & IGoalProgressUpdatedEventReader;
  goalSubmittedForReviewEventStore: IGoalSubmittedForReviewEventWriter & IGoalSubmittedForReviewEventReader;
  goalQualifiedEventStore: IGoalQualifiedEventWriter & IGoalQualifiedEventReader;

  // Work Category - Session Projection Stores - decomposed by use case
  sessionStartedProjector: ISessionStartedProjector;
  sessionEndedProjector: ISessionEndedProjector;
  activeSessionReader: IActiveSessionReader;
  sessionSummaryProjectionStore: ISessionSummaryProjectionStore;
  sessionSummaryReader: ISessionSummaryReader;
  sessionListReader: ISessionListReader;
  // Goal Projection Stores - decomposed by use case
  goalAddedProjector: IGoalAddedProjector;
  goalStartedProjector: IGoalStartedProjector & IGoalReader;
  goalUpdatedProjector: IGoalUpdatedProjector & IGoalUpdateReader;
  goalBlockedProjector: IGoalBlockedProjector;
  goalUnblockedProjector: IGoalUnblockedProjector;
  goalPausedProjector: IGoalPausedProjector & IGoalReader;
  goalResumedProjector: IGoalResumedProjector & IGoalReader;
  goalCompletedProjector: IGoalCompletedProjector & IGoalCompleteReader;
  goalRefinedProjector: IGoalRefinedProjector & IGoalRefineReader;
  goalResetProjector: IGoalResetProjector & IGoalResetReader;
  goalRemovedProjector: IGoalRemovedProjector & IGoalRemoveReader;
  goalProgressUpdatedProjector: IGoalProgressUpdatedProjector & IGoalProgressUpdateReader;
  goalContextReader: IGoalContextReader;
  goalStatusReader: IGoalStatusReader & IGoalReadForSessionSummary;
  // Goal Controllers
  completeGoalController: CompleteGoalController;
  reviewGoalController: ReviewGoalController;
  qualifyGoalController: QualifyGoalController;

  // Solution Category - Event Stores
  // Architecture Event Stores - decomposed by use case
  architectureDefinedEventStore: IArchitectureDefinedEventWriter;
  architectureUpdatedEventStore: IArchitectureUpdatedEventWriter & IArchitectureUpdatedEventReader;
  // Component Event Stores - decomposed by use case
  componentAddedEventStore: IComponentAddedEventWriter;
  componentUpdatedEventStore: IComponentUpdatedEventWriter;
  componentDeprecatedEventStore: IComponentDeprecatedEventWriter;
  componentRemovedEventStore: IComponentRemovedEventWriter;
  // Dependency Event Stores - decomposed by use case
  dependencyAddedEventStore: IDependencyAddedEventWriter;
  dependencyUpdatedEventStore: IDependencyUpdatedEventWriter & IDependencyUpdatedEventReader;
  dependencyRemovedEventStore: IDependencyRemovedEventWriter & IDependencyRemovedEventReader;
  // Decision Event Stores - decomposed by use case
  decisionAddedEventStore: IDecisionAddedEventWriter;
  decisionUpdatedEventStore: IDecisionUpdatedEventWriter;
  decisionReversedEventStore: IDecisionReversedEventWriter;
  decisionSupersededEventStore: IDecisionSupersededEventWriter;
  // Guideline Event Stores - decomposed by use case
  guidelineAddedEventStore: IGuidelineAddedEventWriter;
  guidelineUpdatedEventStore: IGuidelineUpdatedEventWriter & IGuidelineUpdatedEventReader;
  guidelineRemovedEventStore: IGuidelineRemovedEventWriter & IGuidelineRemovedEventReader;
  // Invariant Event Stores - decomposed by use case
  invariantAddedEventStore: IInvariantAddedEventWriter;
  invariantUpdatedEventStore: IInvariantUpdatedEventWriter & IInvariantUpdatedEventReader;
  invariantRemovedEventStore: IInvariantRemovedEventWriter & IInvariantRemovedEventReader;

  // Solution Category - Projection Stores
  // Architecture Projection Stores - decomposed by use case
  architectureDefinedProjector: IArchitectureDefinedProjector & IArchitectureDefineReader;
  architectureUpdatedProjector: IArchitectureUpdatedProjector & IArchitectureUpdateReader;
  architectureReader: IArchitectureReader;
  architectureViewer: IArchitectureViewer;
  // Component Projection Stores - decomposed by use case
  componentAddedProjector: IComponentAddedProjector & IComponentAddReader;
  componentUpdatedProjector: IComponentUpdatedProjector & IComponentUpdateReader;
  componentDeprecatedProjector: IComponentDeprecatedProjector & IComponentDeprecateReader;
  componentRemovedProjector: IComponentRemovedProjector & IComponentRemoveReader;
  componentContextReader: IComponentContextReader;
  componentListReader: IComponentListReader;
  // Dependency Projection Stores - decomposed by use case
  dependencyAddedProjector: IDependencyAddedProjector & IDependencyAddReader;
  dependencyUpdatedProjector: IDependencyUpdatedProjector & IDependencyUpdateReader;
  dependencyRemovedProjector: IDependencyRemovedProjector & IDependencyRemoveReader;
  dependencyContextReader: IDependencyContextReader;
  dependencyListReader: IDependencyListReader;
  // Decision Projection Stores - decomposed by use case
  decisionAddedProjector: IDecisionAddedProjector;
  decisionUpdatedProjector: IDecisionUpdatedProjector & IDecisionUpdateReader;
  decisionReversedProjector: IDecisionReversedProjector & IDecisionReverseReader;
  decisionSupersededProjector: IDecisionSupersededProjector & IDecisionSupersedeReader;
  decisionContextReader: IDecisionContextReader;
  decisionSessionReader: IDecisionSessionReader;
  decisionListReader: IDecisionListReader;
  // Guideline Projection Stores - decomposed by use case
  guidelineAddedProjector: IGuidelineAddedProjector;
  guidelineUpdatedProjector: IGuidelineUpdatedProjector & IGuidelineUpdateReader;
  guidelineRemovedProjector: IGuidelineRemovedProjector & IGuidelineRemoveReader;
  guidelineContextReader: IGuidelineContextReader;
  guidelineListReader: IGuidelineListReader;
  // Invariant Projection Stores - decomposed by use case
  invariantAddedProjector: IInvariantAddedProjector & IInvariantAddReader;
  invariantUpdatedProjector: IInvariantUpdatedProjector & IInvariantUpdateReader;
  invariantRemovedProjector: IInvariantRemovedProjector & IInvariantRemoveReader;
  invariantContextReader: IInvariantContextReader;
  invariantListReader: IInvariantListReader;
  // Solution Context - cross-cutting reader and qualifier
  solutionContextReader: ISolutionContextReader;
  unprimedBrownfieldQualifier: UnprimedBrownfieldQualifier;

  // Project Knowledge Category - Event Stores
  // Project Event Stores - decomposed by use case
  projectInitializedEventStore: IProjectInitializedEventWriter;
  projectUpdatedEventStore: IProjectUpdatedEventWriter;
  // Project Services
  agentFileProtocol: IAgentFileProtocol;
  initializationProtocol: IInitializationProtocol;
  // Audience Event Stores - decomposed by use case
  audienceAddedEventStore: IAudienceAddedEventWriter;
  audienceUpdatedEventStore: IAudienceUpdatedEventWriter;
  audienceRemovedEventStore: IAudienceRemovedEventWriter;
  // AudiencePain Event Stores - decomposed by use case
  audiencePainAddedEventStore: IAudiencePainAddedEventWriter;
  audiencePainUpdatedEventStore: IAudiencePainUpdatedEventWriter;
  audiencePainResolvedEventStore: IAudiencePainResolvedEventWriter;
  // ValueProposition Event Stores - decomposed by use case
  valuePropositionAddedEventStore: IValuePropositionAddedEventWriter;
  valuePropositionUpdatedEventStore: IValuePropositionUpdatedEventWriter;
  valuePropositionRemovedEventStore: IValuePropositionRemovedEventWriter;

  // Project Knowledge Category - Projection Stores
  // Project Projection Stores - decomposed by use case
  projectInitializedProjector: IProjectInitializedProjector & IProjectInitReader;
  projectUpdatedProjector: IProjectUpdatedProjector & IProjectUpdateReader;
  projectContextReader: IProjectContextReader;
  // Audience Projection Stores - decomposed by use case
  audienceAddedProjector: IAudienceAddedProjector;
  audienceUpdatedProjector: IAudienceUpdatedProjector;
  audienceRemovedProjector: IAudienceRemovedProjector & IAudienceRemoveReader;
  audienceContextReader: IAudienceContextReader;
  // AudiencePain Projection Stores - decomposed by use case
  audiencePainAddedProjector: IAudiencePainAddedProjector;
  audiencePainUpdatedProjector: IAudiencePainUpdatedProjector & IAudiencePainUpdateReader;
  audiencePainResolvedProjector: IAudiencePainResolvedProjector;
  audiencePainContextReader: IAudiencePainContextReader;
  // ValueProposition Projection Stores - decomposed by use case
  valuePropositionAddedProjector: IValuePropositionAddedProjector;
  valuePropositionUpdatedProjector: IValuePropositionUpdatedProjector & IValuePropositionUpdateReader;
  valuePropositionRemovedProjector: IValuePropositionRemovedProjector & IValuePropositionRemoveReader;
  valuePropositionContextReader: IValuePropositionContextReader;

  // Relations Category - Event Stores - decomposed by use case
  relationAddedEventStore: IRelationAddedEventWriter;
  relationRemovedEventStore: IRelationRemovedEventWriter & IRelationRemovedEventReader;

  // Relations Category - Projection Stores - decomposed by use case
  relationAddedProjector: IRelationAddedProjector & IRelationAddedReader;
  relationRemovedProjector: IRelationRemovedProjector & IRelationRemovedReader & IRelationReader;
  relationListReader: IRelationListReader;
}
