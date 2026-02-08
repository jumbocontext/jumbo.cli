/**
 * JSON Format Renderer
 *
 * Deterministic, parseable output for agents.
 * Flat result objects, errors to stderr.
 */

import { IFormatRenderer, RenderData } from "../types.js";

export class JsonRenderer implements IFormatRenderer {
  success(message: string, data?: RenderData): void {
    const output = data ? { ...data } : { message };
    this.writeJson(output);
  }

  error(message: string, err?: Error | string): void {
    const errorObj: RenderData = { error: message };

    if (err) {
      if (typeof err === "string") {
        errorObj.details = err;
      } else {
        errorObj.details = err.message;
        if (err.stack) {
          errorObj.stack = err.stack;
        }
      }
    }

    this.writeJson(errorObj, true);
  }

  info(message: string, data?: RenderData): void {
    const output = data ? { info: message, ...data } : { info: message };
    this.writeJson(output);
  }

  data(data: RenderData): void {
    this.writeJson(data);
  }

  section(_title: string): void {
    // Sections are not relevant in JSON output; ignored
  }

  headline(_title: string): void {
    // Sections are not relevant in JSON output; ignored
  }

  banner(_lines: string[]): void {
    // Banners are not relevant in JSON output; ignored
  }

  divider(): void {
    // Dividers are not relevant in JSON output; ignored
  }

  /**
   * Write JSON to stdout or stderr
   */
  private writeJson(data: RenderData, isError = false): void {
    const json = JSON.stringify(data, null, 0); // Compact JSON

    if (isError) {
      console.error(json);
    } else {
      console.log(json);
    }
  }
}
