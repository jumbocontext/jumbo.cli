import { afterEach, describe, expect, it } from "@jest/globals";
import fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { FsSettingsInitializer } from "../../../src/infrastructure/settings/FsSettingsInitializer.js";
import { FsSettingsReader } from "../../../src/infrastructure/settings/FsSettingsReader.js";
import { DEFAULT_SETTINGS } from "../../../src/infrastructure/settings/DefaultSettings.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-settings-init-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("FsSettingsInitializer", () => {
  it("creates settings with default session backlog preview size", async () => {
    const tempDir = await createTempDir();
    const initializer = new FsSettingsInitializer(tempDir);

    await initializer.ensureSettingsFileExists();

    const settings = await new FsSettingsReader(tempDir).read();
    expect(settings.session).toEqual(DEFAULT_SETTINGS.session);
  });
});
