/**
 * Tests for AgentsMdContent value object
 */

import { AgentsMdContent } from "../../../src/domain/project/AgentsMdContent";

describe("AgentsMdContent Value Object", () => {
  describe("getJumboSection()", () => {
    it("should return Jumbo section markdown content", () => {
      const content = AgentsMdContent.getJumboSection();

      expect(content).toContain("## Instructions for Agents on how to collaborate with Jumbo");
      expect(content).toContain("Jumbo CLI for agent orchestration and context management");
      expect(content).toContain("jumbo session start");
      expect(content).toContain("jumbo goal start");
      expect(content).toContain("jumbo component add");
      expect(content).toContain("jumbo decision add");
      expect(content).toContain("jumbo guideline add");
      expect(content).toContain("jumbo invariant add");
    });

    it("should include available commands section", () => {
      const content = AgentsMdContent.getJumboSection();

      expect(content).toContain("### Available Commands");
      expect(content).toContain("jumbo goal add --help");
      expect(content).toContain("jumbo session start --help");
    });

    it("should include proactive section", () => {
      const content = AgentsMdContent.getJumboSection();

      expect(content).toContain("### Be Proactive");
      expect(content).toContain("Be vigilant in identifying");
    });
  });

  describe("getFullContent()", () => {
    it("should return complete AGENTS.md content", () => {
      const content = AgentsMdContent.getFullContent();

      expect(content).toContain("# Agents.md");
      expect(content).toContain("## Instructions for Agents on how to collaborate with Jumbo");
    });

    it("should include Jumbo section in full content", () => {
      const fullContent = AgentsMdContent.getFullContent();
      const jumboSection = AgentsMdContent.getJumboSection();

      expect(fullContent).toContain(jumboSection);
    });
  });

  describe("getLegacyJumboSectionMarkers()", () => {
    it("should return an array of all historically used section headings", () => {
      const markers = AgentsMdContent.getLegacyJumboSectionMarkers();

      expect(markers).toContain("## Instructions for Jumbo");
    });

    it("should not include the current marker", () => {
      const legacyMarkers = AgentsMdContent.getLegacyJumboSectionMarkers();
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();

      expect(legacyMarkers).not.toContain(currentMarker);
    });
  });

  describe("getCurrentJumboSectionMarker()", () => {
    it("should match the heading in getJumboSection()", () => {
      const marker = AgentsMdContent.getCurrentJumboSectionMarker();
      const section = AgentsMdContent.getJumboSection();

      expect(section).toContain(marker);
    });
  });

  describe("replaceJumboSection()", () => {
    it("should return null when no marker is present", () => {
      const content = "# My AGENTS.md\n\nSome other content.";
      expect(AgentsMdContent.replaceJumboSection(content)).toBeNull();
    });

    it("should replace section when current marker is present", () => {
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
      const content = `# Agents.md\n\n${currentMarker}\n\nOld content here.\n`;

      const result = AgentsMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(AgentsMdContent.getJumboSection());
      expect(result).not.toContain("Old content here.");
    });

    it("should replace section when a legacy marker is present", () => {
      const legacyMarker = AgentsMdContent.getLegacyJumboSectionMarkers()[0];
      const content = `# Agents.md\n\n${legacyMarker}\n\nLegacy content here.\n`;

      const result = AgentsMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(AgentsMdContent.getJumboSection());
      expect(result).not.toContain("Legacy content here.");
      expect(result).not.toContain(legacyMarker);
    });

    it("should append when no marker is found", () => {
      const content = "# My AGENTS.md\n\nNo Jumbo section here.";
      const result = AgentsMdContent.replaceJumboSection(content);

      expect(result).toBeNull();
    });

    it("should preserve content before the section", () => {
      const before = "# My Project\n\nCustom intro.\n\n";
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
      const content = `${before}${currentMarker}\n\nOld content.\n`;

      const result = AgentsMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result!.startsWith(before)).toBe(true);
    });

    it("should preserve content after the section when next heading exists", () => {
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
      const content = `# Agents.md\n\n${currentMarker}\n\nOld.\n\n## Other Section\n\nKeep this.`;

      const result = AgentsMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain("## Other Section");
      expect(result).toContain("Keep this.");
    });

    it("should handle section at EOF", () => {
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
      const content = `# Agents.md\n\n${currentMarker}\n\nOld content at EOF.`;

      const result = AgentsMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(AgentsMdContent.getJumboSection());
    });

    it("should preserve content after legacy section when next heading exists", () => {
      const legacyMarker = AgentsMdContent.getLegacyJumboSectionMarkers()[0];
      const content = `# Agents.md\n\n${legacyMarker}\n\nOld.\n\n## Other Section\n\nKeep this.`;

      const result = AgentsMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain("## Other Section");
      expect(result).toContain("Keep this.");
      expect(result).toContain(AgentsMdContent.getCurrentJumboSectionMarker());
    });
  });
});
