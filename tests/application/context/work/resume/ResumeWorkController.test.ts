/**
 * Tests for ResumeWorkController
 */

import { ResumeWorkController } from "../../../../../src/application/context/work/resume/ResumeWorkController";
import { IResumeWorkGateway } from "../../../../../src/application/context/work/resume/IResumeWorkGateway";
import { ResumeWorkResponse } from "../../../../../src/application/context/work/resume/ResumeWorkResponse";

describe("ResumeWorkController", () => {
  let gateway: jest.Mocked<IResumeWorkGateway>;
  let controller: ResumeWorkController;

  const mockResponse: ResumeWorkResponse = {
    goalId: "goal_123",
    objective: "Implement feature",
    context: {
      session: null,
      context: {
        projectContext: null,
        activeGoals: [],
        pausedGoals: [],
        plannedGoals: [],
        recentDecisions: [],
        deactivatedRelations: { count: 0, summary: "No deactivated relations." },
      },
      instructions: ["resume-continuation-prompt"],
      scope: "work-resume",
    },
  };

  beforeEach(() => {
    gateway = {
      resumeWork: jest.fn().mockResolvedValue(mockResponse),
    };

    controller = new ResumeWorkController(gateway);
  });

  it("should delegate to gateway", async () => {
    const request = {};

    const result = await controller.handle(request);

    expect(gateway.resumeWork).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it("should propagate gateway errors", async () => {
    gateway.resumeWork.mockRejectedValue(new Error("Gateway failure"));

    await expect(controller.handle({})).rejects.toThrow("Gateway failure");
  });
});
