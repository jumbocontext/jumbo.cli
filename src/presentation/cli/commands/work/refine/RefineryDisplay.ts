/**
 * Refinery Display
 *
 * Layout and rendering for the `jumbo work refine` daemon.
 * Implements the mockup design with accent bars, glimmer title,
 * compact config, and gradient braille spinners.
 */

import { Colors, BrandColors, Symbols } from "../../../rendering/StyleConfig.js";
import { playGlimmer } from "../../../animations/GlimmerEffect.js";
import { startBrailleSpinner } from "../../../animations/BrailleSpinner.js";

// Raw ANSI codes retained only for the glimmer animation API
// which requires raw string prefixes, not chalk-wrapped strings.
const RESET = "\x1b[0m";
const BRIGHT_WHITE = "\x1b[97m";
const [jbR, jbG, jbB] = BrandColors.jumboBlueRaw;
const JUMBO_BLUE = `\x1b[38;2;${jbR};${jbG};${jbB}m`;

export interface RefineryConfig {
  agentId: string;
  pollIntervalS: number;
  maxRetries: number;
}

export class RefineryDisplay {
  private config: RefineryConfig;
  private write: (s: string) => void;

  constructor(config: RefineryConfig) {
    this.config = config;
    this.write = (s: string) => process.stderr.write(s);
  }

  /** Render the header block: accent bar + glimmer title + config + divider */
  async renderHeader(): Promise<void> {
    const { agentId, pollIntervalS, maxRetries } = this.config;

    this.line("");
    await playGlimmer("Jumbo Refinery", `  ${JUMBO_BLUE}│${RESET} `, {
      baseColor: JUMBO_BLUE,
      highlightColor: BRIGHT_WHITE,
    }, this.write);
    this.out("\n");

    this.line(
      `  ${BrandColors.jumboBlue(Symbols.accentBar)} ${Colors.dim(`${agentId} · poll ${pollIntervalS}s · retries ${maxRetries} · Q to stop`)}`,
    );
    this.divider();
  }

  /** Start the idle "Waiting..." braille spinner */
  startWaiting(): { stop: () => void } {
    return startBrailleSpinner({ label: "foraging", write: this.write });
  }

  /** Render goal discovery info */
  renderGoalStart(
    goalId: string,
    objective: string,
    attempt: number,
    maxRetries: number,
  ): void {
    const sid = this.shortId(goalId);
    this.line(
      `  ${Colors.success(Symbols.filledCircle)} ${Colors.bold(sid)}  ${Colors.dim(`attempt ${attempt}/${maxRetries}`)}`,
    );
    this.line(`  ${Colors.dim(this.truncateObjective(objective))}`);
  }

  /** Start the active "Refining..." braille spinner */
  startRefining(): { stop: () => void } {
    return startBrailleSpinner({ label: "refining", write: this.write });
  }

  /** Render goal completion */
  renderGoalComplete(
    goalId: string,
    objective: string,
    attempts: number,
  ): void {
    const sid = this.shortId(goalId);
    this.line(
      `  ${Colors.success(Symbols.check)} ${Colors.success("refined")}  ${Colors.bold(sid)}  ${Colors.dim(`${attempts} attempt${attempts !== 1 ? "s" : ""}`)}`,
    );
    this.line(`  ${Colors.dim(this.truncateObjective(objective))}`);
    this.line("");
  }

  /** Render goal exhaustion/skip warning */
  renderGoalSkipped(
    goalId: string,
    status: string,
    maxRetries: number,
  ): void {
    const sid = this.shortId(goalId);
    this.line(
      `  ${Colors.warning(Symbols.warning)} ${sid} did not reach 'refined' after ${maxRetries} attempts (status: ${status}). Skipping.`,
    );
    this.line("");
  }

  /** Render retry info */
  renderRetry(attempt: number, maxRetries: number): void {
    this.line(`  ${Colors.dim(`${Symbols.arrow} Retry ${attempt}/${maxRetries}...`)}`);
  }

  /** Render unknown agent error */
  renderUnknownAgent(agent: string, supported: readonly string[]): void {
    this.line(`${Colors.error(Symbols.cross)} Unknown agent '${agent}'. Supported: ${supported.join(", ")}`);
  }

  /** Render shutdown message */
  renderShutdown(): void {
    this.line("");
    this.line(`  ${Colors.dim(`${Symbols.arrow} Refinery stopped.`)}`);
  }

  // --- Private helpers ---

  private out(msg: string): void {
    this.write(msg);
  }

  private line(msg: string): void {
    this.write(`${msg}\n`);
  }

  private divider(): void {
    this.line(`  ${Colors.dim("─".repeat(50))}`);
  }

  private truncateObjective(text: string, max = 60): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 3) + "...";
  }

  private shortId(goalId: string): string {
    return goalId.length > 12 ? goalId.slice(0, 8) : goalId;
  }
}
