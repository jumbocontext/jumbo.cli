/**
 * Command Compliance Tests
 *
 * Ensures all CLI commands follow the standard command pattern.
 * These tests enforce architectural rules and prevent violations.
 */

import fs from 'fs-extra';
import fastGlob from 'fast-glob';
import path from 'path';

describe('Command Compliance', () => {
  jest.setTimeout(30_000);

  let commandFiles: string[];

  beforeAll(async () => {
    // Scan Clean Screaming Architecture directories for command files
    // Commands are identified by having a dot in the filename (e.g., goal.add.ts, db.rebuild.ts)
    commandFiles = await fastGlob([
      'src/presentation/cli/commands/**/*.*.ts'
    ], {
      ignore: ['**/*.test.ts', '**/index.ts', '**/*.d.ts'],
      cwd: process.cwd(),
      absolute: true
    });


  });

  test('all command files exist and are readable', () => {
    expect(commandFiles.length).toBeGreaterThan(0);
    commandFiles.forEach(file => {
      expect(fs.existsSync(file)).toBe(true);
    });
  });

  test('all commands receive container as parameter', async () => {
    const violations: string[] = [];

    for (const file of commandFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      // Commands must have container parameter (or container? for project.init)
      if (!content.includes('container: IApplicationContainer') &&
          !content.includes('container?: IApplicationContainer')) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });

  test('no commands call SqliteConnectionManager.close()', async () => {
    const violations: string[] = [];

    for (const file of commandFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      if (content.includes('SqliteConnectionManager.close()')) {
        violations.push(relativePath);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `ARCHITECTURAL VIOLATION: Commands calling SqliteConnectionManager.close():\n${violations.map(v => `  - ${v}`).join('\n')}\n\n` +
        `Commands must NOT manage infrastructure lifecycle. Container disposal happens at CLI entry point.`
      );
    }
  });

  test('no commands call SqliteConnectionManager.getConnection()', async () => {
    const violations: string[] = [];

    for (const file of commandFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      if (content.includes('SqliteConnectionManager.getConnection(')) {
        violations.push(relativePath);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `ARCHITECTURAL VIOLATION: Commands calling SqliteConnectionManager.getConnection():\n${violations.map(v => `  - ${v}`).join('\n')}\n\n` +
        `Commands should use container.dbConnectionManager instead.`
      );
    }
  });

  test('no commands import old SqliteConnectionManager path', async () => {
    const violations: string[] = [];

    for (const file of commandFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      if (content.includes('from "../../../../infrastructure/persistence/SqliteConnectionManager.js"')) {
        violations.push(relativePath);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Commands importing old SqliteConnectionManager path:\n${violations.map(v => `  - ${v}`).join('\n')}\n\n` +
        `Should import from infrastructure/system/ or use container.`
      );
    }
  });

  test('no commands call bootstrap() directly (except project.init)', async () => {
    const violations: string[] = [];

    for (const file of commandFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      // Skip project.init (special case)
      if (file.includes('project.init.ts')) {
        continue;
      }

      // Check for direct bootstrap() calls
      if (content.match(/const container = bootstrap\(/)) {
        violations.push(relativePath);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Commands calling bootstrap() directly:\n${violations.map(v => `  - ${v}`).join('\n')}\n\n` +
        `Commands should receive container as parameter, not create it.`
      );
    }
  });

  test('no commands create infrastructure manually (except project.init)', async () => {
    const violations: { file: string; violation: string }[] = [];

    for (const file of commandFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      // Skip project.init (special case)
      if (file.includes('project.init.ts')) {
        continue;
      }

      // Check for manual infrastructure creation
      if (content.includes('new InProcessEventBus()')) {
        violations.push({ file: relativePath, violation: 'new InProcessEventBus()' });
      }
      if (content.includes('new FsEventStore(')) {
        violations.push({ file: relativePath, violation: 'new FsEventStore(' });
      }
      if (content.includes('new SqliteConnectionManager(')) {
        violations.push({ file: relativePath, violation: 'new SqliteConnectionManager(' });
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Commands creating infrastructure manually:\n${violations.map(v => `  - ${v.file}: ${v.violation}`).join('\n')}\n\n` +
        `Commands should use container.eventBus, container.eventStore, etc.`
      );
    }
  });

  test('no commands have finally blocks with dispose/close (except project.init)', async () => {
    const violations: string[] = [];

    for (const file of commandFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      // Skip project.init (special case)
      if (file.includes('project.init.ts')) {
        continue;
      }

      // Check for finally blocks with dispose/close
      if (content.match(/finally\s*\{[\s\S]*?(dispose|close)\(\)/)) {
        violations.push(relativePath);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `ARCHITECTURAL VIOLATION: Commands with finally blocks containing dispose/close:\n${violations.map(v => `  - ${v}`).join('\n')}\n\n` +
        `Commands must NOT manage infrastructure lifecycle.`
      );
    }
  });

  test('all commands export metadata', async () => {
    const violations: string[] = [];

    for (const file of commandFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      if (!content.includes('export const metadata')) {
        violations.push(relativePath);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Commands missing metadata export:\n${violations.map(v => `  - ${v}`).join('\n')}`
      );
    }
  });
});
