import { GoalApproveOutputBuilder } from "../../../../../../src/presentation/cli/commands/goals/approve/GoalApproveOutputBuilder";
import { QualifyGoalResponse } from "../../../../../../src/application/context/goals/qualify/QualifyGoalResponse";

describe("GoalApproveOutputBuilder", () => {
  let builder: GoalApproveOutputBuilder;

  beforeEach(() => {
    builder = new GoalApproveOutputBuilder();
  });

  it("should build success output with goal details and next step", () => {
    const response: QualifyGoalResponse = {
      goalId: "goal_123",
      status: "approved",
      objective: "Implement authentication",
    };

    const output = builder.buildSuccess(response);
    const text = output.toHumanReadable();

    expect(text).toContain("Goal Approved");
    expect(text).toContain("goal_123");
    expect(text).toContain("Implement authentication");
    expect(text).toContain("approved");
    expect(text).toContain("jumbo goal codify --id goal_123");
  });

  it("should include next goal ID when present", () => {
    const response: QualifyGoalResponse = {
      goalId: "goal_123",
      status: "approved",
      objective: "Implement authentication",
      nextGoalId: "goal_456",
    };

    const output = builder.buildSuccess(response);
    const text = output.toHumanReadable();

    expect(text).toContain("goal_456");
  });

  it("should build failure error output", () => {
    const output = builder.buildFailureError("Something went wrong");
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to approve goal");
    expect(text).toContain("Something went wrong");
  });

  it("should build failure error output from Error object", () => {
    const output = builder.buildFailureError(new Error("Domain error"));
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to approve goal");
    expect(text).toContain("Domain error");
  });
});
