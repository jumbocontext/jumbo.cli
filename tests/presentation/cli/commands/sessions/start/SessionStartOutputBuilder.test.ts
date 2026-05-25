import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionStartOutputBuilder } from "../../../../../../src/presentation/cli/commands/sessions/start/SessionStartOutputBuilder.js";
import { SessionStartResponse } from "../../../../../../src/application/context/sessions/start/SessionStartResponse.js";

describe("SessionStartOutputBuilder", () => {
  let builder: SessionStartOutputBuilder;

  const response: SessionStartResponse = {
    sessionId: "session-123",
    status: "active",
    isUnprimedBrownfield: false,
  };

  beforeEach(() => {
    builder = new SessionStartOutputBuilder();
  });

  it("should build the session router structured packet", () => {
    const result = builder.buildStructuredOutput(response);

    expect(result).toMatchObject({
      schemaVersion: "jumbo.sessionStart.router.v1",
      packetType: "session.router",
      session: {
        sessionId: "session-123",
        status: "active",
      },
      agentInstruction: {
        primaryAction: "ask_user_to_choose_workflow",
      },
    });
    expect(result.routes).toHaveProperty("design_or_define_goal");
    expect(result.routes).toHaveProperty("refine_goal");
    expect(result.routes).toHaveProperty("execute_goal");
    expect(result.routes).toHaveProperty("review_goal");
    expect(result.routes).toHaveProperty("codify_goal");
  });

  it("should route design or definition to project north-star context", () => {
    const result = builder.buildStructuredOutput(response);
    const routes = result.routes as Record<string, Record<string, string>>;

    expect(routes.design_or_define_goal.command).toBe(
      "jumbo project show --northstar --format json"
    );
  });

  it("should include fallback command for goal-id routes", () => {
    const result = builder.buildStructuredOutput(response);
    const routes = result.routes as Record<string, Record<string, string>>;

    for (const key of ["refine_goal", "execute_goal", "review_goal", "codify_goal"]) {
      expect(routes[key].command).toContain("<goalId>");
      expect(routes[key].fallbackCommand).toBe("jumbo goals list --format json");
    }
  });

  it("should not include eager session context in structured output", () => {
    const result = builder.buildStructuredOutput(response);

    expect(result).not.toHaveProperty("projectContext");
    expect(result).not.toHaveProperty("goals");
    expect(result).not.toHaveProperty("llmInstructions");
    expect(result).not.toHaveProperty("recentDecisions");
  });

  it("should ask for workflow choice without naming hidden route classes", () => {
    const result = builder.buildStructuredOutput(response);
    const instruction = result.agentInstruction as Record<string, string>;

    expect(instruction.prompt).toContain("design or define a goal");
    expect(instruction.prompt).toContain("refine a goal");
    expect(instruction.prompt).toContain("execute a goal");
    expect(instruction.prompt).toContain("review a goal");
    expect(instruction.prompt).toContain("codify a goal");
    expect(instruction.prompt).toContain("something different");
    expect(instruction.prompt).not.toContain("ad-hoc");
    expect(instruction.prompt).not.toContain("preprompted");
  });

  it("should render router text without eager project or goal context", () => {
    const output = builder.buildSessionStartOutput(response);
    const text = output.toHumanReadable();

    expect(text).toContain("design_or_define_goal");
    expect(text).toContain("jumbo project show --northstar --format json");
    expect(text).not.toContain("projectContext:");
    expect(text).not.toContain("goals:");
    expect(text).not.toContain("recentDecisions:");
  });

  it("should include dedicated brownfield instruction for unprimed repositories", () => {
    const result = builder.buildStructuredOutput({
      ...response,
      isUnprimedBrownfield: true,
    });

    expect(result.brownfieldInstruction).toMatchObject({
      prompt: expect.stringContaining("BROWNFIELD PROJECT"),
    });
  });

  it("should include brownfield prompt in text output for unprimed repositories", () => {
    const output = builder.buildSessionStartOutput({
      ...response,
      isUnprimedBrownfield: true,
    });

    expect(output.toHumanReadable()).toContain("BROWNFIELD PROJECT");
  });
});
