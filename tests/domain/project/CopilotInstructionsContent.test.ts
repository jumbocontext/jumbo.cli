/**
 * Tests for CopilotInstructionsContent value object
 */

import { CopilotInstructionsContent } from "../../../src/domain/project/CopilotInstructionsContent";

describe("CopilotInstructionsContent Value Object", () => {
  describe("getCopilotInstructions()", () => {
    it("should return Copilot instructions markdown content", () => {
      const content = CopilotInstructionsContent.getCopilotInstructions();

      expect(content).toContain("## Jumbo Context Management");
      expect(content).toContain("jumbo session start");
      expect(content).toContain("jumbo goal start");
    });
  });

  describe("getCopilotSectionMarker()", () => {
    it("should match the heading in getCopilotInstructions()", () => {
      const marker = CopilotInstructionsContent.getCopilotSectionMarker();
      const content = CopilotInstructionsContent.getCopilotInstructions();

      expect(content).toContain(marker);
    });
  });

  describe("replaceCopilotSection()", () => {
    it("should return null when marker is not present", () => {
      const content = "# Copilot Instructions\n\nSome other content.";
      expect(CopilotInstructionsContent.replaceCopilotSection(content)).toBeNull();
    });

    it("should replace section with current version", () => {
      const oldSection = "## Jumbo Context Management\n\nOld copilot content.\n";
      const content = `# Copilot\n\n${oldSection}`;

      const result = CopilotInstructionsContent.replaceCopilotSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(CopilotInstructionsContent.getCopilotInstructions());
      expect(result).not.toContain("Old copilot content.");
    });

    it("should preserve content before the section", () => {
      const before = "# Copilot Instructions\n\nCustom intro.\n\n";
      const content = `${before}## Jumbo Context Management\n\nOld.\n`;

      const result = CopilotInstructionsContent.replaceCopilotSection(content);

      expect(result).not.toBeNull();
      expect(result!.startsWith(before)).toBe(true);
    });

    it("should preserve content after the section when next heading exists", () => {
      const content =
        "# Copilot\n\n## Jumbo Context Management\n\nOld.\n\n## Other Section\n\nKeep this.";

      const result = CopilotInstructionsContent.replaceCopilotSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain("## Other Section");
      expect(result).toContain("Keep this.");
    });

    it("should handle section at EOF", () => {
      const content = "# Copilot\n\n## Jumbo Context Management\n\nOld content at EOF.";

      const result = CopilotInstructionsContent.replaceCopilotSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(CopilotInstructionsContent.getCopilotInstructions());
    });
  });
});
