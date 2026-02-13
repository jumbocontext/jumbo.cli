/**
 * Tests for AgentInstructions value object
 */

import { AgentInstructions } from "../../../../src/domain/project/AgentInstructions";

describe("AgentInstructions Value Object", () => {
  describe("getJumboSection()", () => {
    it("should return Jumbo section markdown content", () => {
      // Act
      const content = AgentInstructions.getJumboSection();

      // Assert
      expect(content).toContain("## Instructions for Jumbo");
      expect(content).toContain("**IMPORTANT: This project uses Jumbo CLI for agent orchestration and context management.**");
      expect(content).toContain("jumbo session start");
      expect(content).toContain("jumbo goal start");
      expect(content).toContain("jumbo component add");
      expect(content).toContain("jumbo decision add");
      expect(content).toContain("jumbo guideline add");
      expect(content).toContain("jumbo invariant add");
    });

    it("should include available commands section", () => {
      // Act
      const content = AgentInstructions.getJumboSection();

      // Assert
      expect(content).toContain("### Available Commands");
      expect(content).toContain("jumbo goal add --help");
      expect(content).toContain("jumbo session start --help");
    });

    it("should include proactive section", () => {
      // Act
      const content = AgentInstructions.getJumboSection();

      // Assert
      expect(content).toContain("### Be Proactive");
      expect(content).toContain("Be vigilant in identifying insights");
    });
  });

  describe("getFullContent()", () => {
    it("should return complete AGENTS.md content", () => {
      // Act
      const content = AgentInstructions.getFullContent();

      // Assert
      expect(content).toContain("# Agents.md");
      expect(content).toContain("## Instructions for Jumbo");
    });

    it("should include Jumbo section in full content", () => {
      // Act
      const fullContent = AgentInstructions.getFullContent();
      const jumboSection = AgentInstructions.getJumboSection();

      // Assert
      expect(fullContent).toContain(jumboSection);
    });
  });

  describe("getAgentFileReference()", () => {
    it("should return reference text for CLAUDE.md and GEMINI.md", () => {
      // Act
      const reference = AgentInstructions.getAgentFileReference();

      // Assert
      expect(reference).toContain("AGENTS.md");
      expect(reference).toContain("IMPORTANT");
      expect(reference).toContain("further instructions");
    });

    it("should start and end with newlines for proper appending", () => {
      // Act
      const reference = AgentInstructions.getAgentFileReference();

      // Assert
      expect(reference.startsWith("\n")).toBe(true);
      expect(reference.endsWith("\n")).toBe(true);
    });
  });

  describe("getJumboSectionMarker()", () => {
    it("should return the section marker used for detection", () => {
      // Act
      const marker = AgentInstructions.getJumboSectionMarker();

      // Assert
      expect(marker).toBe("## Instructions for Jumbo");
    });

    it("should match the marker in getJumboSection()", () => {
      // Act
      const marker = AgentInstructions.getJumboSectionMarker();
      const section = AgentInstructions.getJumboSection();

      // Assert
      expect(section).toContain(marker);
    });
  });

  describe("replaceJumboSection()", () => {
    it("should return null when marker is not present", () => {
      const content = "# My AGENTS.md\n\nSome other content.";
      expect(AgentInstructions.replaceJumboSection(content)).toBeNull();
    });

    it("should replace section with current version", () => {
      const oldSection = "## Instructions for Jumbo\n\nOld content here.\n";
      const content = `# Agents.md\n\n${oldSection}`;

      const result = AgentInstructions.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(AgentInstructions.getJumboSection());
      expect(result).not.toContain("Old content here.");
    });

    it("should preserve content before the section", () => {
      const before = "# My Project\n\nCustom intro.\n\n";
      const content = `${before}## Instructions for Jumbo\n\nOld content.\n`;

      const result = AgentInstructions.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result!.startsWith(before)).toBe(true);
    });

    it("should preserve content after the section when next heading exists", () => {
      const content =
        "# Agents.md\n\n## Instructions for Jumbo\n\nOld.\n\n## Other Section\n\nKeep this.";

      const result = AgentInstructions.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain("## Other Section");
      expect(result).toContain("Keep this.");
    });

    it("should handle section at EOF", () => {
      const content = "# Agents.md\n\n## Instructions for Jumbo\n\nOld content at EOF.";

      const result = AgentInstructions.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(AgentInstructions.getJumboSection());
    });
  });

  describe("replaceAgentFileReference()", () => {
    it("should return null when marker is not present", () => {
      const content = "# CLAUDE.md\n\nSome other content.";
      expect(AgentInstructions.replaceAgentFileReference(content)).toBeNull();
    });

    it("should replace reference block with current version", () => {
      const oldRef =
        "\nCRITICAL STARTUP INSTRUCTION: Old instructions.\n\nOld middle.\n\n!!!IMPORTANT!!! Old.\n";
      const content = `# CLAUDE.md\n${oldRef}`;

      const result = AgentInstructions.replaceAgentFileReference(content);

      expect(result).not.toBeNull();
      expect(result).toContain("CRITICAL STARTUP INSTRUCTION:");
      expect(result).not.toContain("Old instructions.");
    });

    it("should preserve content before the reference block", () => {
      const before = "# CLAUDE.md\n\nCustom rules.\n";
      const ref = AgentInstructions.getAgentFileReference();
      const content = before + ref;

      const result = AgentInstructions.replaceAgentFileReference(content);

      expect(result).not.toBeNull();
      expect(result).toContain("Custom rules.");
    });

    it("should preserve content after the reference block", () => {
      const ref = AgentInstructions.getAgentFileReference();
      const after = "\n## My Custom Section\n\nKeep this.";
      const content = "# CLAUDE.md\n" + ref + after;

      const result = AgentInstructions.replaceAgentFileReference(content);

      expect(result).not.toBeNull();
      expect(result).toContain("My Custom Section");
      expect(result).toContain("Keep this.");
    });
  });

  describe("replaceCopilotSection()", () => {
    it("should return null when marker is not present", () => {
      const content = "# Copilot Instructions\n\nSome other content.";
      expect(AgentInstructions.replaceCopilotSection(content)).toBeNull();
    });

    it("should replace section with current version", () => {
      const oldSection = "## Jumbo Context Management\n\nOld copilot content.\n";
      const content = `# Copilot\n\n${oldSection}`;

      const result = AgentInstructions.replaceCopilotSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(AgentInstructions.getCopilotInstructions());
      expect(result).not.toContain("Old copilot content.");
    });

    it("should preserve content before the section", () => {
      const before = "# Copilot Instructions\n\nCustom intro.\n\n";
      const content = `${before}## Jumbo Context Management\n\nOld.\n`;

      const result = AgentInstructions.replaceCopilotSection(content);

      expect(result).not.toBeNull();
      expect(result!.startsWith(before)).toBe(true);
    });

    it("should preserve content after the section when next heading exists", () => {
      const content =
        "# Copilot\n\n## Jumbo Context Management\n\nOld.\n\n## Other Section\n\nKeep this.";

      const result = AgentInstructions.replaceCopilotSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain("## Other Section");
      expect(result).toContain("Keep this.");
    });

    it("should handle section at EOF", () => {
      const content = "# Copilot\n\n## Jumbo Context Management\n\nOld content at EOF.";

      const result = AgentInstructions.replaceCopilotSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(AgentInstructions.getCopilotInstructions());
    });
  });
});
