import fs from "fs-extra";
import fastGlob from "fast-glob";
import path from "path";

describe("Command Compliance", () => {
  let files: { rel: string; content: string }[];

  beforeAll(async () => {
    const absPaths = await fastGlob(["src/presentation/cli/commands/**/*.*.ts"], {
      ignore: ["**/*.test.ts", "**/index.ts", "**/*.d.ts"],
      cwd: process.cwd(),
      absolute: true,
    });
    files = await Promise.all(
      absPaths.map(async (abs) => ({
        rel: path.relative(process.cwd(), abs),
        content: await fs.readFile(abs, "utf-8"),
      })),
    );
  });

  const isProjectInit = (rel: string) => rel.endsWith("project.init.ts");

  const violations = (predicate: (f: { rel: string; content: string }) => boolean, skipInit = false) =>
    files.filter((f) => (skipInit && isProjectInit(f.rel) ? false : predicate(f))).map((f) => f.rel);

  test("at least one command file is discovered", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test("all commands receive container as parameter", () => {
    expect(
      violations(
        (f) =>
          !f.content.includes("container: IApplicationContainer") &&
          !f.content.includes("container?: IApplicationContainer"),
      ),
    ).toEqual([]);
  });

  test("no commands call SqliteConnectionManager.close()", () => {
    expect(violations((f) => f.content.includes("SqliteConnectionManager.close()"))).toEqual([]);
  });

  test("no commands call SqliteConnectionManager.getConnection()", () => {
    expect(violations((f) => f.content.includes("SqliteConnectionManager.getConnection("))).toEqual([]);
  });

  test("no commands import old SqliteConnectionManager path", () => {
    expect(
      violations((f) =>
        f.content.includes('from "../../../../infrastructure/persistence/SqliteConnectionManager.js"'),
      ),
    ).toEqual([]);
  });

  test("no commands call bootstrap() directly (except project.init)", () => {
    expect(violations((f) => /const container = bootstrap\(/.test(f.content), true)).toEqual([]);
  });

  test("no commands create infrastructure manually (except project.init)", () => {
    const banned = ["new InProcessEventBus()", "new FsEventStore(", "new SqliteConnectionManager("];
    expect(violations((f) => banned.some((b) => f.content.includes(b)), true)).toEqual([]);
  });

  test("no commands have finally blocks with dispose/close (except project.init)", () => {
    expect(violations((f) => /finally\s*\{[\s\S]*?(dispose|close)\(\)/.test(f.content), true)).toEqual([]);
  });

  test("all commands export metadata", () => {
    expect(violations((f) => !f.content.includes("export const metadata"))).toEqual([]);
  });
});
