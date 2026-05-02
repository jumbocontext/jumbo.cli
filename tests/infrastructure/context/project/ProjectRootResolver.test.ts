/**
 * Tests for ProjectRootResolver
 *
 * findNearest() walks process.cwd() up to the filesystem root searching for an
 * ancestor with a .jumbo directory. To assert the "no match" case
 * deterministically — independent of whether the developer's machine happens
 * to have a stray .jumbo somewhere above os.tmpdir() — these tests mock the
 * `fs` module so existence checks are confined to a controlled set of paths.
 *
 * Per project guideline, ESM mocks use jest.unstable_mockModule + dynamic
 * await import().
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import * as path from "path";

type ResolverModule = typeof import("../../../../src/infrastructure/context/project/ProjectRootResolver");

interface FakeFs {
  jumboDirs: Set<string>;
}

function setupFakeFs(): FakeFs {
  const fakeFs: FakeFs = { jumboDirs: new Set() };

  jest.unstable_mockModule("fs", () => ({
    existsSync: (target: unknown): boolean => {
      const targetPath = path.resolve(String(target));
      return fakeFs.jumboDirs.has(targetPath);
    },
    statSync: (_target: unknown) => ({
      isDirectory: (): boolean => true,
    }),
  }));

  return fakeFs;
}

async function loadResolver(): Promise<ResolverModule> {
  return await import(
    "../../../../src/infrastructure/context/project/ProjectRootResolver"
  );
}

describe("ProjectRootResolver", () => {
  let fakeFs: FakeFs;

  beforeEach(() => {
    jest.resetModules();
    fakeFs = setupFakeFs();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe("resolve()", () => {
    it("returns cwd when .jumbo exists at cwd", async () => {
      const cwd = path.resolve("/tmp/project-resolve-hit");
      fakeFs.jumboDirs.add(path.join(cwd, ".jumbo"));
      jest.spyOn(process, "cwd").mockReturnValue(cwd);

      const { ProjectRootResolver } = await loadResolver();
      expect(new ProjectRootResolver().resolve()).toBe(cwd);
    });

    it("throws when .jumbo does not exist at cwd", async () => {
      const cwd = path.resolve("/tmp/project-resolve-miss");
      jest.spyOn(process, "cwd").mockReturnValue(cwd);

      const { ProjectRootResolver } = await loadResolver();
      expect(() => new ProjectRootResolver().resolve()).toThrow(
        /No Jumbo project found/
      );
    });
  });

  describe("resolveOrDefault()", () => {
    it("returns cwd when .jumbo exists at cwd", async () => {
      const cwd = path.resolve("/tmp/project-or-default-hit");
      fakeFs.jumboDirs.add(path.join(cwd, ".jumbo"));
      jest.spyOn(process, "cwd").mockReturnValue(cwd);

      const { ProjectRootResolver } = await loadResolver();
      expect(new ProjectRootResolver().resolveOrDefault()).toBe(cwd);
    });

    it("returns cwd when .jumbo does not exist", async () => {
      const cwd = path.resolve("/tmp/project-or-default-miss");
      jest.spyOn(process, "cwd").mockReturnValue(cwd);

      const { ProjectRootResolver } = await loadResolver();
      expect(new ProjectRootResolver().resolveOrDefault()).toBe(cwd);
    });
  });

  describe("findNearest()", () => {
    it("returns cwd when .jumbo exists at cwd", async () => {
      const cwd = path.resolve("/tmp/find-nearest-cwd-hit");
      fakeFs.jumboDirs.add(path.join(cwd, ".jumbo"));
      jest.spyOn(process, "cwd").mockReturnValue(cwd);

      const { ProjectRootResolver } = await loadResolver();
      expect(new ProjectRootResolver().findNearest()).toBe(cwd);
    });

    it("returns ancestor path when .jumbo exists at an ancestor", async () => {
      const ancestor = path.resolve("/tmp/find-nearest-ancestor");
      const cwd = path.join(ancestor, "a", "b", "c");
      fakeFs.jumboDirs.add(path.join(ancestor, ".jumbo"));
      jest.spyOn(process, "cwd").mockReturnValue(cwd);

      const { ProjectRootResolver } = await loadResolver();
      expect(new ProjectRootResolver().findNearest()).toBe(ancestor);
    });

    it("returns null when no ancestor contains .jumbo", async () => {
      const cwd = path.resolve("/tmp/find-nearest-miss/a/b");
      jest.spyOn(process, "cwd").mockReturnValue(cwd);

      const { ProjectRootResolver } = await loadResolver();
      expect(new ProjectRootResolver().findNearest()).toBeNull();
    });
  });
});
