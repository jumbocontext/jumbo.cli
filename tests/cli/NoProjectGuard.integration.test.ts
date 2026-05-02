/**
 * Integration tests for the bootstrap-level "no project" guard in src/cli.ts.
 *
 * Spawns the compiled CLI (node dist/cli.js) so that we exercise the actual
 * entry point — including the guard that runs BEFORE Host construction. The
 * key invariant under test: when a requiresProject:true command is invoked
 * outside a Jumbo project root, the working directory must be unchanged on
 * disk after the invocation (no .jumbo, no jumbo.db, no event files, no
 * migration artifacts).
 */

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { spawnSync } from "node:child_process";
import fs from "fs-extra";
import * as path from "node:path";
import * as os from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const COMPILED_CLI = path.join(PROJECT_ROOT, "dist", "cli.js");

const ANCESTOR_WARNING_PATTERN = (ancestorPath: string, cwd: string): RegExp =>
  new RegExp(
    `A Jumbo project exists at ${escapeRegex(ancestorPath)}\\. Your current directory is ${escapeRegex(cwd)}\\. Change directory back to the project root before running this command\\.`
  );

const NO_PROJECT_WARNING_PATTERN = (cwd: string): RegExp =>
  new RegExp(
    `No Jumbo project was found at ${escapeRegex(cwd)} or any parent directory\\. If you intended to run this command in an existing project, change directory to it\\. Only run jumbo project init here if you intend to start a new Jumbo project\\.`
  );

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface CliInvocation {
  args: string[];
  description: string;
}

const PROJECT_SCOPED_INVOCATIONS: CliInvocation[] = [
  {
    args: ["decision", "add", "--title", "X", "--rationale", "Y"],
    description: "decision add",
  },
  {
    args: ["component", "add", "--name", "C", "--description", "D"],
    description: "component add",
  },
  { args: ["session", "start"], description: "session start" },
  {
    args: [
      "goal",
      "add",
      "--objective",
      "O",
      "--title",
      "T",
      "--criteria",
      "foo",
    ],
    description: "goal add",
  },
];

async function snapshotDir(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string, rel: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const childAbs = path.join(current, entry.name);
      const childRel = rel ? path.join(rel, entry.name) : entry.name;
      out.push(childRel + (entry.isDirectory() ? "/" : ""));
      if (entry.isDirectory()) {
        await walk(childAbs, childRel);
      }
    }
  }
  await walk(dir, "");
  return out.sort();
}

async function findStrayAncestor(start: string): Promise<string | null> {
  let dir = path.resolve(start);
  while (true) {
    if (await fs.pathExists(path.join(dir, ".jumbo"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

describe("NoProjectGuard (integration)", () => {
  let workspaceRoot: string;

  beforeAll(async () => {
    if (!(await fs.pathExists(COMPILED_CLI))) {
      throw new Error(
        `Compiled CLI not found at ${COMPILED_CLI}. Run \`npm run build\` before running this test.`
      );
    }
    workspaceRoot = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-no-project-guard-"))
    );
  });

  async function findStrayAncestor(start: string): Promise<string | null> {
    let dir = path.resolve(start);
    while (true) {
      if (await fs.pathExists(path.join(dir, ".jumbo"))) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        return null;
      }
      dir = parent;
    }
  }

  afterAll(async () => {
    if (workspaceRoot) {
      await fs.remove(workspaceRoot);
    }
  });

  describe("temp directory with no .jumbo at any level", () => {
    let cwd: string;

    beforeAll(async () => {
      // This scenario requires that no ancestor of the tmp workspace contains
      // a stray .jumbo. Such a stray would be the exact pollution this guard
      // is designed to prevent — and it would also corrupt this test by
      // causing the guard to fire the ancestor-found warning instead of the
      // no-project-found warning. CI environments are clean, so this only
      // bites on developer machines that ran a project-scoped command from
      // a non-project directory before this fix landed.
      const stray = await findStrayAncestor(os.tmpdir());
      if (stray !== null) {
        throw new Error(
          `Stray .jumbo directory detected at ${stray}\\.jumbo — remove it (events/, jumbo.db, snapshots/, packs/, settings.jsonc, manifest.json, CONTEXT_SNAPSHOT.md) before running this test scenario.`
        );
      }
      cwd = path.join(workspaceRoot, "no-ancestor");
      await fs.mkdirp(cwd);
    });

    for (const invocation of PROJECT_SCOPED_INVOCATIONS) {
      it(`exits non-zero, prints warning, and creates nothing for "${invocation.description}"`, async () => {
        const before = await snapshotDir(cwd);

        const result = spawnSync(
          process.execPath,
          [COMPILED_CLI, ...invocation.args],
          { cwd, encoding: "utf8" }
        );

        const after = await snapshotDir(cwd);

        expect(result.status).not.toBe(0);
        expect(result.stderr).toMatch(NO_PROJECT_WARNING_PATTERN(cwd));
        expect(after).toEqual(before);
      });
    }
  });

  describe("nested subdirectory of a project that has an ancestor .jumbo", () => {
    let projectRoot: string;
    let cwd: string;

    beforeAll(async () => {
      projectRoot = path.join(workspaceRoot, "with-ancestor");
      await fs.mkdirp(path.join(projectRoot, ".jumbo"));
      cwd = path.join(projectRoot, "nested", "deeper");
      await fs.mkdirp(cwd);
    });

    for (const invocation of PROJECT_SCOPED_INVOCATIONS) {
      it(`exits non-zero, prints warning pointing to the ancestor, and creates nothing for "${invocation.description}"`, async () => {
        const before = await snapshotDir(cwd);

        const result = spawnSync(
          process.execPath,
          [COMPILED_CLI, ...invocation.args],
          { cwd, encoding: "utf8" }
        );

        const after = await snapshotDir(cwd);

        expect(result.status).not.toBe(0);
        expect(result.stderr).toMatch(
          ANCESTOR_WARNING_PATTERN(projectRoot, cwd)
        );
        expect(after).toEqual(before);
      });
    }
  });
});
