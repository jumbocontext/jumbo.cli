import { Command } from 'commander';
import type { RunControlFile, TamperAction, TamperEvent } from '../../domain/types.js';
import type { ResultStore } from '../../storage/result-store.js';

export interface ControlDeps {
  readonly storeProvider: () => Promise<ResultStore>;
}

const VALID_ACTIONS = ['pause', 'resume', 'abort', 'inject-context'] as const;

export function registerControlCommand(program: Command, deps: ControlDeps): void {
  program
    .command('control <runId> <action> [payload]')
    .description('Send a control action (pause, resume, abort, inject-context) to a live run')
    .option('--allow-tampering', 'Required acknowledgement that this mutates the run and quarantines its records from aggregate lift calculations')
    .option('--operator <name>', 'Operator identifier recorded on the TamperEvent')
    .option('--harness <name>', 'Restrict the action to a single harness')
    .option('--variant <variant>', 'Restrict the action to a single variant (jumbo|baseline)')
    .addHelpText('after', `
Examples:
  eval control <runId> pause --allow-tampering
  eval control <runId> resume --allow-tampering
  eval control <runId> abort --allow-tampering --operator alice
  eval control <runId> inject-context "Remember to test edge case X" --allow-tampering
    `)
    .action(async (
      runId: string,
      action: string,
      payload: string | undefined,
      opts: {
        allowTampering?: boolean;
        operator?: string;
        harness?: string;
        variant?: string;
      },
    ) => {
      if (!VALID_ACTIONS.includes(action as TamperAction)) {
        throw new Error(`Unknown control action: ${action}. Valid: ${VALID_ACTIONS.join(', ')}`);
      }
      if (!opts.allowTampering) {
        throw new Error(
          `Refusing to send '${action}' without --allow-tampering. Mutating actions taint the run and exclude it from aggregate lift by default.`,
        );
      }
      const tamperAction = action as TamperAction;
      if (tamperAction === 'inject-context') {
        if (!payload || payload.length === 0) {
          throw new Error('inject-context requires a payload string');
        }
        if (opts.variant && opts.variant !== 'jumbo') {
          throw new Error('inject-context is only valid for the jumbo variant');
        }
      }
      if (opts.variant && opts.variant !== 'jumbo' && opts.variant !== 'baseline') {
        throw new Error(`Unknown variant: ${opts.variant}. Must be 'jumbo' or 'baseline'.`);
      }

      const store = await deps.storeProvider();
      if (!store.readRunControl || !store.writeRunControl) {
        throw new Error('Configured store does not support run control files');
      }

      const event: TamperEvent = {
        occurredAt: new Date().toISOString(),
        action: tamperAction,
        ...(opts.harness !== undefined ? { harness: opts.harness } : {}),
        ...(opts.variant !== undefined
          ? { variant: opts.variant as 'jumbo' | 'baseline' }
          : tamperAction === 'inject-context' ? { variant: 'jumbo' as const } : {}),
        ...(payload !== undefined ? { payload } : {}),
        ...(opts.operator !== undefined ? { operator: opts.operator } : {}),
      };

      const existing = await store.readRunControl(runId);
      const next: RunControlFile = {
        runId,
        updatedAt: new Date().toISOString(),
        pendingActions: [...(existing?.pendingActions ?? []), event],
        pauseRequested: tamperAction === 'pause'
          ? true
          : tamperAction === 'resume'
            ? false
            : (existing?.pauseRequested ?? false),
        abortRequested: tamperAction === 'abort'
          ? true
          : (existing?.abortRequested ?? false),
      };
      await store.writeRunControl(runId, next);
      console.log(`Recorded ${tamperAction} for run ${runId}.`);
    });
}
