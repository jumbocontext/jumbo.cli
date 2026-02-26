/**
 * Integration test for goal pause/resume lifecycle
 * Tests the full stack: command handlers, domain logic, event persistence, and projections
 */

import * as fs from "fs-extra";
import * as path from "path";
import { Host } from "../../src/infrastructure/host/Host.js";
import { IApplicationContainer } from "../../src/application/host/IApplicationContainer.js";
import { AddGoalCommandHandler } from "../../src/application/context/goals/add/AddGoalCommandHandler.js";
import { AddGoalCommand } from "../../src/application/context/goals/add/AddGoalCommand.js";
import { RefineGoalCommandHandler } from "../../src/application/context/goals/refine/RefineGoalCommandHandler.js";
import { RefineGoalCommand } from "../../src/application/context/goals/refine/RefineGoalCommand.js";
import { StartGoalCommandHandler } from "../../src/application/context/goals/start/StartGoalCommandHandler.js";
import { StartGoalCommand } from "../../src/application/context/goals/start/StartGoalCommand.js";
import { PrerequisitePolicy } from "../../src/domain/goals/rules/PrerequisitePolicy.js";
import { PauseGoalCommandHandler } from "../../src/application/context/goals/pause/PauseGoalCommandHandler.js";
import { PauseGoalCommand } from "../../src/application/context/goals/pause/PauseGoalCommand.js";
import { ResumeGoalCommandHandler } from "../../src/application/context/goals/resume/ResumeGoalCommandHandler.js";
import { ResumeGoalCommand } from "../../src/application/context/goals/resume/ResumeGoalCommand.js";
import { GoalStatus, GoalEventType } from "../../src/domain/goals/Constants.js";

describe("Pause-Resume Lifecycle Integration", () => {
  jest.setTimeout(30_000);
  let tmpDir: string;
  let host: Host;
  let container: IApplicationContainer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-pause-resume-"));
    host = new Host(tmpDir);
    const builder = host.createBuilder();
    container = await builder.build();
  });

  afterEach(async () => {
    // Dispose of host resources for testing (production uses signal handlers)
    host.dispose();
    // Wait for Windows to release file locks on WAL files
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.remove(tmpDir);
  });

  it("full lifecycle: create → start → pause → resume", async () => {
    // 1. Add goal
    const addHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus
    );
    const addCommand: AddGoalCommand = {
      title: "Pause/resume lifecycle",
      objective: "Test pause/resume lifecycle",
      successCriteria: ["Lifecycle works correctly"],
    };
    const addResult = await addHandler.execute(addCommand);
    const goalId = addResult.goalId;

    // Verify projection after add
    let view = await container.goalStartedProjector.findById(goalId);
    expect(view).toBeDefined();
    expect(view!.status).toBe(GoalStatus.TODO);
    expect(view!.version).toBe(1);

    // 2. Refine goal (transitions to IN_REFINEMENT)
    const refineHandler = new RefineGoalCommandHandler(
      container.goalRefinedEventStore,
      container.goalRefinedEventStore,
      container.goalRefinedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler
    );
    const refineCommand: RefineGoalCommand = {
      goalId,
    };
    await refineHandler.execute(refineCommand);

    // Verify projection after refine
    view = await container.goalRefinedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.IN_REFINEMENT);
    expect(view!.version).toBe(2);

    // 2b. Commit goal (transitions from IN_REFINEMENT to REFINED)
    await container.commitGoalController.handle({ goalId });

    // Verify projection after commit
    view = await container.goalRefinedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.REFINED);
    expect(view!.version).toBe(3);

    // 3. Start goal
    const startHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler,
      new PrerequisitePolicy()
    );
    const startCommand: StartGoalCommand = {
      goalId,
    };
    await startHandler.execute(startCommand);

    // Verify projection after start
    view = await container.goalStartedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.DOING);
    expect(view!.version).toBe(4);

    // 4. Pause goal
    const pauseHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );
    const pauseCommand: PauseGoalCommand = {
      goalId,
      reason: "ContextCompressed",
      note: "Testing pause functionality",
    };
    await pauseHandler.execute(pauseCommand);

    // Verify projection after pause
    view = await container.goalPausedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.PAUSED);
    expect(view!.note).toBe("Testing pause functionality");
    expect(view!.version).toBe(5);

    // 5. Resume goal
    const resumeHandler = new ResumeGoalCommandHandler(
      container.goalResumedEventStore,
      container.goalResumedEventStore,
      container.goalResumedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler
    );
    const resumeCommand: ResumeGoalCommand = {
      goalId,
      note: "Testing resume functionality",
    };
    await resumeHandler.execute(resumeCommand);

    // Verify projection after resume
    view = await container.goalResumedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.DOING);
    expect(view!.note).toBe("Testing resume functionality");
    expect(view!.version).toBe(6);

    // Note: Completion requires QUALIFIED status which needs the full qualification workflow
    // This test focuses on pause/resume lifecycle only

    // Verify event stream correctness
    const events = await container.eventStore.readStream(goalId);
    expect(events).toHaveLength(6);
    expect(events[0].type).toBe(GoalEventType.ADDED);
    expect(events[1].type).toBe(GoalEventType.REFINEMENT_STARTED);
    expect(events[2].type).toBe(GoalEventType.COMMITTED);
    expect(events[3].type).toBe(GoalEventType.STARTED);
    expect(events[4].type).toBe(GoalEventType.PAUSED);
    expect(events[5].type).toBe(GoalEventType.RESUMED);

    // Verify all events persisted to file system
    const eventsDir = path.join(tmpDir, "events", goalId);
    const files = await fs.readdir(eventsDir);
    expect(files).toHaveLength(6);
    expect(files).toContain("000001.GoalAddedEvent.json");
    expect(files).toContain("000002.GoalRefinementStartedEvent.json");
    expect(files).toContain("000003.GoalCommittedEvent.json");
    expect(files).toContain("000004.GoalStartedEvent.json");
    expect(files).toContain("000005.GoalPausedEvent.json");
    expect(files).toContain("000006.GoalResumedEvent.json");
  });

  it("pause event contains reason and note", async () => {
    // Setup: create, refine, and start goal
    const addHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus
    );
    const addResult = await addHandler.execute({
      title: "Pause details",
      objective: "Test pause details",
      successCriteria: ["Works"],
    });
    const goalId = addResult.goalId;

    const refineHandler = new RefineGoalCommandHandler(
      container.goalRefinedEventStore,
      container.goalRefinedEventStore,
      container.goalRefinedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler
    );
    await refineHandler.execute({ goalId });
    await container.commitGoalController.handle({ goalId });

    const startHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler,
      new PrerequisitePolicy()
    );
    await startHandler.execute({ goalId });

    // Pause with reason and note
    const pauseHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );
    await pauseHandler.execute({
      goalId,
      reason: "Other",
      note: "Need to switch priorities",
    });

    // Verify event stream includes reason and note
    const events = await container.eventStore.readStream(goalId);
    const pausedEvent = events.find((e: { type: string }) => e.type === GoalEventType.PAUSED);
    expect(pausedEvent).toBeDefined();
    expect((pausedEvent as any).payload.reason).toBe("Other");
    expect((pausedEvent as any).payload.note).toBe("Need to switch priorities");
  });

  it("can pause and resume multiple times", async () => {
    // Setup: create, refine, and start goal
    const addHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus
    );
    const addResult = await addHandler.execute({
      title: "Multiple pause/resume",
      objective: "Test multiple pause/resume",
      successCriteria: ["Works"],
    });
    const goalId = addResult.goalId;

    const refineHandler = new RefineGoalCommandHandler(
      container.goalRefinedEventStore,
      container.goalRefinedEventStore,
      container.goalRefinedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler
    );
    await refineHandler.execute({ goalId });
    await container.commitGoalController.handle({ goalId });

    const startHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler,
      new PrerequisitePolicy()
    );
    await startHandler.execute({ goalId });

    const pauseHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );

    const resumeHandler = new ResumeGoalCommandHandler(
      container.goalResumedEventStore,
      container.goalResumedEventStore,
      container.goalResumedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler
    );

    // First pause/resume cycle
    await pauseHandler.execute({ goalId, reason: "ContextCompressed" });
    let view = await container.goalPausedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.PAUSED);

    await resumeHandler.execute({ goalId });
    view = await container.goalResumedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.DOING);

    // Second pause/resume cycle
    await pauseHandler.execute({ goalId, reason: "Other" });
    view = await container.goalPausedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.PAUSED);

    await resumeHandler.execute({ goalId });
    view = await container.goalResumedProjector.findById(goalId);
    expect(view!.status).toBe(GoalStatus.DOING);

    // Verify event stream has all events
    const events = await container.eventStore.readStream(goalId);
    expect(events).toHaveLength(8); // add, refine, commit, start, pause, resume, pause, resume
    const pausedEvents = events.filter((e: { type: string }) => e.type === GoalEventType.PAUSED);
    const resumedEvents = events.filter((e: { type: string }) => e.type === GoalEventType.RESUMED);
    expect(pausedEvents).toHaveLength(2);
    expect(resumedEvents).toHaveLength(2);
  });

  it("projection stays consistent with event stream", async () => {
    // Create full lifecycle
    const addHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus
    );
    const addResult = await addHandler.execute({
      title: "Projection consistency",
      objective: "Test projection consistency",
      successCriteria: ["Consistent"],
    });
    const goalId = addResult.goalId;

    const refineHandler = new RefineGoalCommandHandler(
      container.goalRefinedEventStore,
      container.goalRefinedEventStore,
      container.goalRefinedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler
    );
    await refineHandler.execute({ goalId });
    await container.commitGoalController.handle({ goalId });

    const startHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler,
      new PrerequisitePolicy()
    );
    await startHandler.execute({ goalId });

    const pauseHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );
    await pauseHandler.execute({ goalId, reason: "ContextCompressed" });

    const resumeHandler = new ResumeGoalCommandHandler(
      container.goalResumedEventStore,
      container.goalResumedEventStore,
      container.goalResumedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler
    );
    await resumeHandler.execute({ goalId });

    // Read projection
    const view = await container.goalResumedProjector.findById(goalId);

    // Read event stream and reconstruct state
    const events = await container.eventStore.readStream(goalId);
    expect(events).toHaveLength(6);

    // Projection version should match latest event version
    expect(view!.version).toBe(events[events.length - 1].version);
    expect(view!.status).toBe(GoalStatus.DOING);
  });
});
