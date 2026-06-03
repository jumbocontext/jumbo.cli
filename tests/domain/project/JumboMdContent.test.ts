/**
 * Tests for JumboMdContent value object
 */

import { JumboMdContent } from "../../../src/domain/project/JumboMdContent";

describe("JumboMdContent Value Object", () => {
  describe("getJumboSection()", () => {
    it("should return bootstrap-only Jumbo section markdown content", () => {
      const content = JumboMdContent.getJumboSection();

      expect(content).toContain("## Instructions for Agents on how to collaborate with Jumbo");
      expect(content).toContain("jumbo session start");
      expect(content).toContain("already been routed");
    });

    it("should not include command catalog content", () => {
      const content = JumboMdContent.getJumboSection();

      expect(content).not.toContain("### Available Commands");
      expect(content).not.toContain("jumbo goal refine --help");
      expect(content).not.toContain("jumbo session start --help");
    });

    it("should not include workflow or context-maintenance playbook prose", () => {
      const content = JumboMdContent.getJumboSection();

      expect(content).not.toContain("### Maintain Context as You Work");
      expect(content).not.toContain("### Before Starting Work on a Goal");
      expect(content).not.toContain("jumbo decision add --title");
      expect(content).not.toContain("jumbo component add --name");
    });

    it("should not include legacy letter copy", () => {
      const content = JumboMdContent.getJumboSection();

      expect(content).not.toContain("Dear Agent,");
      expect(content).not.toContain("Sincerely,");
      expect(content).not.toContain("Project Administrator");
    });

    it("should not include lifecycle hook instructions", () => {
      const content = JumboMdContent.getJumboSection();

      expect(content).not.toContain("### Pre Compaction/Compression");
      expect(content).not.toContain("### After Compaction/Compression");
      expect(content).not.toContain("jumbo work pause");
      expect(content).not.toContain("jumbo work resume");
    });

    it("should not include next-step orientation copy", () => {
      const content = JumboMdContent.getJumboSection();

      expect(content).not.toContain("### Next step:");
      expect(content).not.toContain("retrieve project orientation");
    });
  });

  describe("getFullContent()", () => {
    it("should return complete JUMBO.md content with header", () => {
      const content = JumboMdContent.getFullContent();

      expect(content).toContain("# JUMBO.md");
      expect(content).toContain("## Instructions for Agents on how to collaborate with Jumbo");
    });

    it("should include Jumbo section in full content", () => {
      const fullContent = JumboMdContent.getFullContent();
      const jumboSection = JumboMdContent.getJumboSection();

      expect(fullContent).toContain(jumboSection);
    });
  });

  describe("getCurrentSectionMarker()", () => {
    it("should match the heading in getJumboSection()", () => {
      const marker = JumboMdContent.getCurrentSectionMarker();
      const section = JumboMdContent.getJumboSection();

      expect(section).toContain(marker);
    });
  });

  describe("getLegacySectionMarkers()", () => {
    it("should return an array of all historically used section headings", () => {
      const markers = JumboMdContent.getLegacySectionMarkers();

      expect(markers).toContain("## Instructions for Jumbo");
    });

    it("should not include the current marker", () => {
      const legacyMarkers = JumboMdContent.getLegacySectionMarkers();
      const currentMarker = JumboMdContent.getCurrentSectionMarker();

      expect(legacyMarkers).not.toContain(currentMarker);
    });
  });

  describe("replaceJumboSection()", () => {
    it("should return null when no marker is present", () => {
      const content = "# My JUMBO.md\n\nSome other content.";
      expect(JumboMdContent.replaceJumboSection(content)).toBeNull();
    });

    it("should replace section when current marker is present", () => {
      const currentMarker = JumboMdContent.getCurrentSectionMarker();
      const content = `# JUMBO.md\n\n${currentMarker}\n\nOld content here.\n`;

      const result = JumboMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(JumboMdContent.getJumboSection());
      expect(result).not.toContain("Old content here.");
    });

    it("should replace section when a legacy marker is present", () => {
      const legacyMarker = JumboMdContent.getLegacySectionMarkers()[0];
      const content = `# JUMBO.md\n\n${legacyMarker}\n\nLegacy content here.\n`;

      const result = JumboMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(JumboMdContent.getJumboSection());
      expect(result).not.toContain("Legacy content here.");
      expect(result).not.toContain(legacyMarker);
    });

    it("should preserve content before the section", () => {
      const before = "# JUMBO.md\n\nCustom intro.\n\n";
      const currentMarker = JumboMdContent.getCurrentSectionMarker();
      const content = `${before}${currentMarker}\n\nOld content.\n`;

      const result = JumboMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result!.startsWith(before)).toBe(true);
    });

    it("should preserve content after the section when next heading exists", () => {
      const currentMarker = JumboMdContent.getCurrentSectionMarker();
      const content = `# JUMBO.md\n\n${currentMarker}\n\nOld.\n\n## Other Section\n\nKeep this.`;

      const result = JumboMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain("## Other Section");
      expect(result).toContain("Keep this.");
    });

    it("should handle section at EOF", () => {
      const currentMarker = JumboMdContent.getCurrentSectionMarker();
      const content = `# JUMBO.md\n\n${currentMarker}\n\nOld content at EOF.`;

      const result = JumboMdContent.replaceJumboSection(content);

      expect(result).not.toBeNull();
      expect(result).toContain(JumboMdContent.getJumboSection());
    });
  });
});
