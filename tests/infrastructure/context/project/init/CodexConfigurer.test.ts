/**
 * Tests for CodexConfigurer infrastructure implementation
 */

import { CodexConfigurer } from "../../../../../src/infrastructure/context/project/init/CodexConfigurer";

describe("CodexConfigurer", () => {
  const configurer = new CodexConfigurer();

  describe("agent", () => {
    it("should have the correct agent identity", () => {
      expect(configurer.agent).toEqual({ id: "codex", name: "Codex" });
    });
  });

  describe("skillPlatforms", () => {
    it("should declare .codex/skills as the skill platform", () => {
      expect(configurer.skillPlatforms).toEqual([".codex/skills"]);
    });
  });

  describe("configure()", () => {
    it("should complete without error", async () => {
      await expect(configurer.configure("/fake/root")).resolves.not.toThrow();
    });
  });

  describe("getPlannedFileChanges()", () => {
    it("should return no planned file changes", async () => {
      const changes = await configurer.getPlannedFileChanges("/fake/root");
      expect(changes).toEqual([]);
    });
  });
});
