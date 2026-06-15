import { Command } from 'commander';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { createTestScenario } from '../../domain/types.js';
import type { ResultStore } from '../../storage/result-store.js';
import type { Disruption, ExpectedJumboMemoryCapture, JumboPlan, TestScenario } from '../../domain/types.js';

export interface ScenarioCreateDeps {
  readonly storeProvider: () => Promise<ResultStore>;
}

interface ScenarioTemplate {
  name: string;
  initialPrompt: string;
  continuationPrompt?: string;
  sessionCount: number;
  expectedFiles?: string[];
  retentionPatterns?: string[];
  disruptions?: Disruption[];
  expectedJumboMemoryCaptures?: ExpectedJumboMemoryCapture[];
  jumboPlan?: JumboPlan;
}

export function registerScenarioCommands(parent: Command, deps: ScenarioCreateDeps): void {
  parent
    .command('create')
    .description('Define a new test scenario from a JSON template')
    .requiredOption('--from-template <path>', 'Path to JSON template file')
    .option('--name <name>', 'Override scenario name from template')
    .option('--sessions <count>', 'Override session count', parseInt)
    .addHelpText('after', `
Examples:
  eval scenario create --from-template ./scenarios/basic.json
  eval scenario create --from-template ./scenarios/basic.json --name "Custom Name" --sessions 5
    `)
    .action(async (opts: { fromTemplate: string; name?: string; sessions?: number }) => {
      const template = await loadTemplate(opts.fromTemplate);
      const scenario = handleScenarioCreate(template, { name: opts.name, sessions: opts.sessions });
      const store = await deps.storeProvider();
      await store.saveScenario(scenario);
      console.log(scenario.id);
    });
}

async function loadTemplate(filePath: string): Promise<ScenarioTemplate> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot read template file '${filePath}': ${msg}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Template file '${filePath}' is not valid JSON: ${msg}`);
  }

  return validateTemplate(parsed, filePath);
}

function validateTemplate(value: unknown, filePath: string): ScenarioTemplate {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Template '${filePath}' must be a JSON object`);
  }
  const t = value as Record<string, unknown>;
  if (typeof t.name !== 'string' || t.name.length === 0) {
    throw new Error(`Template '${filePath}' is missing required string field 'name'`);
  }
  if (typeof t.initialPrompt !== 'string' || t.initialPrompt.length === 0) {
    throw new Error(`Template '${filePath}' is missing required string field 'initialPrompt'`);
  }
  if (typeof t.sessionCount !== 'number' || !Number.isInteger(t.sessionCount) || t.sessionCount < 1) {
    throw new Error(`Template '${filePath}' must have integer 'sessionCount' >= 1`);
  }
  return t as unknown as ScenarioTemplate;
}

export function handleScenarioCreate(
  template: ScenarioTemplate,
  overrides?: { name?: string; sessions?: number },
): TestScenario {
  return createTestScenario({
    id: randomUUID(),
    name: overrides?.name ?? template.name,
    initialPrompt: template.initialPrompt,
    continuationPrompt: template.continuationPrompt,
    sessionCount: overrides?.sessions ?? template.sessionCount,
    expectedFiles: template.expectedFiles,
    retentionPatterns: template.retentionPatterns,
    disruptions: template.disruptions,
    expectedJumboMemoryCaptures: template.expectedJumboMemoryCaptures,
    jumboPlan: template.jumboPlan,
  });
}
