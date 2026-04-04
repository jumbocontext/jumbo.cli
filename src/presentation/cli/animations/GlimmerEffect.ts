/**
 * Glimmer Effect
 *
 * Sweep-highlight animation for text: displays text in a base color,
 * sweeps a bright highlight across it, then flashes and settles.
 */

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

export interface GlimmerConfig {
  /** ANSI escape for the base text color */
  baseColor: string;
  /** ANSI escape for the sweep highlight color */
  highlightColor: string;
  /** Number of characters in the highlight band (default 3) */
  sweepWidth?: number;
  /** Milliseconds per sweep step (default 40) */
  sweepMs?: number;
  /** Milliseconds to hold the flash (default 100) */
  flashMs?: number;
  /** Milliseconds to hold before sweep starts (default 200) */
  settleMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Play a glimmer animation on a text string.
 *
 * 1. Show text in base color
 * 2. Sweep a bright highlight left → right
 * 3. Flash the full text bright
 * 4. Settle back to base color
 *
 * Degrades to a single print in non-TTY mode.
 */
export async function playGlimmer(
  text: string,
  padding: string,
  config: GlimmerConfig,
  write: (s: string) => void = (s) => process.stderr.write(s),
): Promise<void> {
  const {
    baseColor,
    highlightColor,
    sweepWidth = 3,
    sweepMs = 40,
    flashMs = 100,
    settleMs = 200,
  } = config;

  // Non-TTY fallback
  if (!process.stderr.isTTY) {
    write(`${padding}${text}\n`);
    return;
  }

  // Show full text in base color
  write(`\r${padding}${BOLD}${baseColor}${text}${RESET}`);
  await sleep(settleMs);

  // Sweep highlight across
  for (let pos = -sweepWidth; pos <= text.length; pos++) {
    let rendered = padding;
    for (let i = 0; i < text.length; i++) {
      if (i >= pos && i < pos + sweepWidth) {
        rendered += `${BOLD}${highlightColor}${text[i]}`;
      } else {
        rendered += `${BOLD}${baseColor}${text[i]}`;
      }
    }
    write(`\r${rendered}${RESET}`);
    await sleep(sweepMs);
  }

  // Flash pop
  write(`\r${padding}${BOLD}${highlightColor}${text}${RESET}`);
  await sleep(flashMs);

  // Settle back to base
  write(`\r${padding}${BOLD}${baseColor}${text}${RESET}`);
}
