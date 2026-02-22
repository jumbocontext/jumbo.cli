/**
 * Tests for decision.reverse CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { decisionReverse } from "../../../../../../src/presentation/cli/commands/decisions/reverse/decision.reverse.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { ReverseDecisionController } from "../../../../../../src/application/context/decisions/reverse/ReverseDecisionController.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("decision.reverse command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let mockController: jest.Mocked<Pick<ReverseDecisionController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    } as jest.Mocked<Pick<ReverseDecisionController, "handle">>;

    mockContainer = {
      reverseDecisionController: mockController as unknown as ReverseDecisionController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should reverse a decision via the controller", async () => {
    mockController.handle.mockResolvedValue({ decisionId: "dec_123" });

    await decisionReverse(
      { id: "dec_123", reason: "Requirements changed" },
      mockContainer as IApplicationContainer
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      decisionId: "dec_123",
      reason: "Requirements changed",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should display error and exit on failure", async () => {
    mockController.handle.mockRejectedValue(new Error("Decision not found"));

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);

    await decisionReverse(
      { id: "dec_999", reason: "No longer needed" },
      mockContainer as IApplicationContainer
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
