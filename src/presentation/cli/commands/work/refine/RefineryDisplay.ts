/**
 * Refinery Display
 *
 * Layout and rendering for the `jumbo work refine` daemon.
 * Implements the mockup design with accent bars, glimmer title,
 * compact config, and gradient braille spinners.
 */

import { BrandColors } from "../../../rendering/StyleConfig.js";
import { playGlimmer } from "../../../animations/GlimmerEffect.js";
import { startBrailleSpinner } from "../../../animations/BrailleSpinner.js";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
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
      `  ${JUMBO_BLUE}│${RESET} ${DIM}${agentId} · poll ${pollIntervalS}s · retries ${maxRetries} · Q to stop${RESET}`,
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
      `  ${GREEN}●${RESET} ${BOLD}${sid}${RESET}  ${DIM}attempt ${attempt}/${maxRetries}${RESET}`,
    );
    this.line(`  ${DIM}${this.truncateObjective(objective)}${RESET}`);
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
      `  ${GREEN}✓${RESET} ${GREEN}refined${RESET}  ${BOLD}${sid}${RESET}  ${DIM}${attempts} attempt${attempts !== 1 ? "s" : ""}${RESET}`,
    );
    this.line(`  ${DIM}${this.truncateObjective(objective)}${RESET}`);
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
      `  ${YELLOW}⚠${RESET} ${sid} did not reach 'refined' after ${maxRetries} attempts (status: ${status}). Skipping.`,
    );
    this.line("");
  }

  /** Render retry info */
  renderRetry(attempt: number, maxRetries: number): void {
    this.line(`  ${DIM}→ Retry ${attempt}/${maxRetries}...${RESET}`);
  }

  /** Render unknown agent error */
  renderUnknownAgent(agent: string, supported: readonly string[]): void {
    this.line(`${RED}✗${RESET} Unknown agent '${agent}'. Supported: ${supported.join(", ")}`);
  }

  /** Render shutdown message */
  renderShutdown(): void {
    this.line("");
    this.line(`  ${DIM}→ Refinery stopped.${RESET}`);
  }

  // --- Private helpers ---

  private out(msg: string): void {
    this.write(msg);
  }

  private line(msg: string): void {
    this.write(`${msg}\n`);
  }

  private divider(): void {
    this.line(`  ${DIM}${"─".repeat(50)}${RESET}`);
  }

  private truncateObjective(text: string, max = 60): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 3) + "...";
  }

  private shortId(goalId: string): string {
    return goalId.length > 12 ? goalId.slice(0, 8) : goalId;
  }
}
