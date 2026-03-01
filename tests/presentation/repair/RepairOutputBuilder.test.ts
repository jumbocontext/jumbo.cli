/**
 * Tests for RepairOutputBuilder
 */

import { RepairOutputBuilder } from "../../../src/presentation/cli/commands/repair/RepairOutputBuilder";
import { RepairStepResult } from "../../../src/application/repair/RepairResponse";

describe("RepairOutputBuilder", () => {
  let builder: RepairOutputBuilder;

  beforeEach(() => {
    builder = new RepairOutputBuilder();
  });

  describe("buildSuccess()", () => {
    it("should include success prompt", () => {
      const steps: RepairStepResult[] = [
        { name: "AGENTS.md", status: "repaired" },
      ];

      const output = builder.buildSuccess(steps);
      const text = output.toHumanReadable();

      expect(text).toContain("Repair complete");
    });

    it("should include step data", () => {
      const steps: RepairStepResult[] = [
        { name: "AGENTS.md", status: "repaired" },
        { name: "Database", status: "skipped" },
        { name: "Settings", status: "failed", detail: "Permission denied" },
      ];

      const output = builder.buildSuccess(steps);
      const sections = output.getSections();

      // Should have prompt + data sections
      expect(sections.length).toBe(2);
      expect(sections[0].type).toBe("prompt");
      expect(sections[1].type).toBe("data");
    });
  });

  describe("buildFailureError()", () => {
    it("should include failure prompt with Error object", () => {
      const output = builder.buildFailureError(new Error("Something broke"));
      const text = output.toHumanReadable();

      expect(text).toContain("Repair failed");
    });

    it("should include failure prompt with string", () => {
      const output = builder.buildFailureError("Something broke");
      const text = output.toHumanReadable();

      expect(text).toContain("Repair failed");
    });
  });

  describe("buildConfirmationRequired()", () => {
    it("should include warning text", () => {
      const output = builder.buildConfirmationRequired();
      const text = output.toHumanReadable();

      expect(text).toContain("--yes");
    });
  });
});
