import { GoalSubmitOutputBuilder } from "../../../../../../src/presentation/cli/commands/goals/submit/GoalSubmitOutputBuilder";
import { SubmitGoalResponse } from "../../../../../../src/application/context/goals/submit/SubmitGoalResponse";

describe("GoalSubmitOutputBuilder", () => {
  let builder: GoalSubmitOutputBuilder;

  beforeEach(() => {
    builder = new GoalSubmitOutputBuilder();
  });

  it("should build success output with goal details and next step", () => {
    const response: SubmitGoalResponse = {
      goalId: "goal_123",
      status: "submitted",
      objective: "Implement authentication",
    };

    const output = builder.buildSuccess(response);
    const text = output.toHumanReadable();

    expect(text).toContain("Goal Submitted");
    expect(text).toContain("goal_123");
    expect(text).toContain("Implement authentication");
    expect(text).toContain("submitted");
    expect(text).toContain("jumbo goal review --id goal_123");
  });

  it("should build failure error output", () => {
    const output = builder.buildFailureError("Something went wrong");
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to submit goal");
    expect(text).toContain("Something went wrong");
  });

  it("should build failure error output from Error object", () => {
    const output = builder.buildFailureError(new Error("Domain error"));
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to submit goal");
    expect(text).toContain("Domain error");
  });
});
