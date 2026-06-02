/**
 * Tests for AgentFileAssetContent value object
 */

import fs from "fs-extra";
import path from "path";
import { AgentFileAssetContent } from "../../../src/domain/project/AgentFileAssetContent";

describe("AgentFileAssetContent", () => {
  it("should load managed markdown assets with a trailing newline", () => {
    const content = AgentFileAssetContent.readMarkdown("JUMBO.md");

    expect(content).toContain("# JUMBO.md");
    expect(content.endsWith("\n")).toBe(true);
  });

  it("should load managed JSON fragments", () => {
    const fragment = AgentFileAssetContent.readJson("codex-hooks.fragment.json");

    expect(fragment).toEqual(
      expect.objectContaining({
        hooks: expect.objectContaining({
          SessionStart: expect.any(Array),
        }),
      })
    );
  });

  it("should extract a marked section from managed markdown", () => {
    const content = AgentFileAssetContent.readMarkdown("AGENTS.md");
    const section = AgentFileAssetContent.extractSection(
      content,
      "## Instructions for Agents on how to collaborate with Jumbo"
    );

    expect(section).toContain("See JUMBO.md and follow all instructions.");
    expect(section).not.toContain("# AGENTS.md");
  });

  it("should include assets in npm package files", async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(process.cwd(), "package.json"), "utf-8"));

    expect(packageJson.files).toContain("assets");
  });
});
