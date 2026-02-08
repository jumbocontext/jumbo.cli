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
});
