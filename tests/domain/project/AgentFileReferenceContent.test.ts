/**
 * Tests for AgentFileReferenceContent value object
 */

import { AgentFileReferenceContent } from "../../../src/domain/project/AgentFileReferenceContent";

describe("AgentFileReferenceContent Value Object", () => {
  describe("getAgentFileReference()", () => {
    it("should return reference text for CLAUDE.md and GEMINI.md", () => {
      const reference = AgentFileReferenceContent.getAgentFileReference();

      expect(reference).toContain("AGENTS.md");
      expect(reference).toContain("IMPORTANT");
      expect(reference).toContain("further instructions");
    });

    it("should start and end with newlines for proper appending", () => {
      const reference = AgentFileReferenceContent.getAgentFileReference();

      expect(reference.startsWith("\n")).toBe(true);
      expect(reference.endsWith("\n")).toBe(true);
    });
  });

  describe("replaceAgentFileReference()", () => {
    it("should return null when marker is not present", () => {
      const content = "# CLAUDE.md\n\nSome other content.";
      expect(AgentFileReferenceContent.replaceAgentFileReference(content)).toBeNull();
    });

    it("should replace reference block with current version", () => {
      const oldRef =
        "\nCRITICAL STARTUP INSTRUCTION: Old instructions.\n\nOld middle.\n\n!!!IMPORTANT!!! Old.\n";
      const content = `# CLAUDE.md\n${oldRef}`;

      const result = AgentFileReferenceContent.replaceAgentFileReference(content);

      expect(result).not.toBeNull();
      expect(result).toContain("CRITICAL STARTUP INSTRUCTION:");
      expect(result).not.toContain("Old instructions.");
    });

    it("should preserve content before the reference block", () => {
      const before = "# CLAUDE.md\n\nCustom rules.\n";
      const ref = AgentFileReferenceContent.getAgentFileReference();
      const content = before + ref;

      const result = AgentFileReferenceContent.replaceAgentFileReference(content);

      expect(result).not.toBeNull();
      expect(result).toContain("Custom rules.");
    });

    it("should preserve content after the reference block", () => {
      const ref = AgentFileReferenceContent.getAgentFileReference();
      const after = "\n## My Custom Section\n\nKeep this.";
      const content = "# CLAUDE.md\n" + ref + after;

      const result = AgentFileReferenceContent.replaceAgentFileReference(content);

      expect(result).not.toBeNull();
      expect(result).toContain("My Custom Section");
      expect(result).toContain("Keep this.");
    });
  });
});
