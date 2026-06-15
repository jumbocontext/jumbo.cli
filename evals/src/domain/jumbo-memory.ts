/**
 * Captured Jumbo memory state: the entities Jumbo holds and the CLI commands
 * used to read them. Pre/post-session snapshots are the primary evidence for
 * in-session captures.
 */

export type JumboMemoryKind = 'decision' | 'guideline' | 'invariant' | 'component' | 'relation' | 'dependency';

export interface ExpectedJumboMemoryCapture {
  readonly kind: JumboMemoryKind;
  readonly match: string;
  readonly sessionNumber?: number;
}

export interface JumboMemoryEntity {
  readonly kind: JumboMemoryKind;
  readonly id?: string;
  readonly text: string;
  readonly raw: unknown;
}

export interface JumboMemoryCommandResult {
  readonly kind: JumboMemoryKind;
  readonly command: readonly string[];
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

export interface JumboMemorySnapshot {
  readonly sessionNumber: number;
  readonly capturedAt: string;
  readonly entities: readonly JumboMemoryEntity[];
  readonly commands: readonly JumboMemoryCommandResult[];
}
