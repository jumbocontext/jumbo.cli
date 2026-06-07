import type { ProjectStatsSnapshotView } from "../../../../../application/context/project/stats/ProjectStatsSnapshotView.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";

export class ProjectStatsOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  build(snapshot: ProjectStatsSnapshotView): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(this.toText(snapshot));
    return this.builder.build();
  }

  buildStructured(snapshot: ProjectStatsSnapshotView): TerminalOutput {
    this.builder.reset();
    this.builder.addData({ projectStats: this.toData(snapshot) });
    return this.builder.build();
  }

  private toData(snapshot: ProjectStatsSnapshotView): Record<string, unknown> {
    return {
      project: snapshot.project,
      work: snapshot.work,
      memory: snapshot.memory,
      graph: snapshot.graph,
    };
  }

  private toText(snapshot: ProjectStatsSnapshotView): string {
    return [
      "Project Stats",
      "",
      "Project",
      `  Audiences: ${snapshot.project.audiences.totalAudiences}`,
      `  Primary audiences: ${snapshot.project.audiences.primaryAudiences}`,
      `  Secondary audiences: ${snapshot.project.audiences.secondaryAudiences}`,
      `  Audience pains: ${snapshot.project.audiencePains.audiencePainsCount}`,
      `  Value propositions: ${snapshot.project.valuePropositions.valuePropositionsCount}`,
      "",
      "Work",
      `  Defined goals: ${snapshot.work.goals.definedGoalsCount}`,
      `  Refined goals: ${snapshot.work.goals.refinedGoalsCount}`,
      `  In-progress goals: ${snapshot.work.goals.inProgressGoalsCount}`,
      `  Submitted goals: ${snapshot.work.goals.submittedGoalsCount}`,
      `  Closed goals: ${snapshot.work.goals.closedGoalsCount}`,
      `  Sessions: ${snapshot.work.sessions.sessionsCount}`,
      "",
      "Memory",
      `  Decisions: ${snapshot.memory.decisions.decisionsCount}`,
      `  Components: ${snapshot.memory.components.componentsCount}`,
      `  Dependencies: ${snapshot.memory.dependencies.dependenciesCount}`,
      `  Invariants: ${snapshot.memory.invariants.invariantsCount}`,
      `  Guidelines: ${snapshot.memory.guidelines.guidelinesCount}`,
      "",
      "Graph",
      `  Relations: ${snapshot.graph.relationCount}`,
    ].join("\n");
  }
}
