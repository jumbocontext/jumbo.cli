import { Command } from 'commander';
import type { TestScenario } from '../../domain/types.js';
import type { ResultStore } from '../../storage/result-store.js';

export interface ScenarioListDeps {
  readonly storeProvider: () => Promise<ResultStore>;
}

export function registerScenarioListCommand(parent: Command, deps: ScenarioListDeps): void {
  parent
    .command('list')
    .description('Show available test scenarios')
    .option('--json', 'Output as JSON')
    .addHelpText('after', `
Examples:
  eval scenario list
  eval scenario list --json
    `)
    .action(async (opts: { json?: boolean }) => {
      const store = await deps.storeProvider();
      const scenarios = await store.listScenarios();
      if (opts.json) {
        console.log(JSON.stringify(scenarios, null, 2));
      } else {
        console.log(formatScenarioList(scenarios));
      }
    });
}

export function formatScenarioList(scenarios: readonly TestScenario[]): string {
  if (scenarios.length === 0) {
    return 'No scenarios found. Create one with: eval scenario create --from-template <path>';
  }

  const lines: string[] = [];
  const divider = '─'.repeat(60);

  lines.push(`  ${scenarios.length} scenario(s) available`);
  lines.push(divider);

  for (const s of scenarios) {
    lines.push(`  ${s.id}`);
    lines.push(`    Name:     ${s.name}`);
    lines.push(`    Sessions: ${s.sessionCount}`);
    lines.push(`    Created:  ${s.createdAt}`);
    if (s.disruptions && s.disruptions.length > 0) {
      lines.push(`    Disruptions: ${s.disruptions.length}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
