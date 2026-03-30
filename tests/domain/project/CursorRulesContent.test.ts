/**
 * Tests for CursorRulesContent domain value object
 */

import { CursorRulesContent } from "../../../src/domain/project/CursorRulesContent";

describe("CursorRulesContent", () => {
  describe("getFullContent()", () => {
    it("should include YAML frontmatter with alwaysApply: true", () => {
      const content = CursorRulesContent.getFullContent();
      expect(content).toContain("---\nalwaysApply: true\n---");
    });

    it("should include reference to JUMBO.md", () => {
      const content = CursorRulesContent.getFullContent();
      expect(content).toContain("JUMBO.md");
    });

    it("should include the section marker", () => {
      const content = CursorRulesContent.getFullContent();
      expect(content).toContain(CursorRulesContent.getSectionMarker());
    });
  });

  describe("getSectionMarker()", () => {
    it("should return the cursor-rules section marker", () => {
      expect(CursorRulesContent.getSectionMarker()).toBe("<!-- jumbo:cursor-rules -->");
    });
  });

  describe("replaceSection()", () => {
    it("should return null when marker is not found", () => {
      const result = CursorRulesContent.replaceSection("Some random content");
      expect(result).toBeNull();
    });

    it("should replace content from marker to EOF", () => {
      const existing = `---
alwaysApply: true
---

<!-- jumbo:cursor-rules -->

# Jumbo Context Management

Old stale instructions that need replacing.
`;
      const result = CursorRulesContent.replaceSection(existing);

      expect(result).not.toBeNull();
      expect(result).toContain("JUMBO.md");
      expect(result).not.toContain("Old stale instructions");
      expect(result).toContain("alwaysApply: true");
    });

    it("should preserve content before the marker", () => {
      const existing = `---
alwaysApply: true
---

# Custom Header

Some custom content.

<!-- jumbo:cursor-rules -->

Old content.
`;
      const result = CursorRulesContent.replaceSection(existing);

      expect(result).not.toBeNull();
      expect(result).toContain("# Custom Header");
      expect(result).toContain("Some custom content.");
      expect(result).toContain("JUMBO.md");
      expect(result).not.toContain("Old content.");
    });
  });
});
