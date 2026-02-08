/**
 * YAML Format Renderer
 *
 * Human-readable structured output for agents and humans who prefer YAML.
 * Flat result objects, errors to stderr.
 */

import YAML from "yaml";
import { IFormatRenderer, RenderData } from "../types.js";

export class YamlRenderer implements IFormatRenderer {
  success(message: string, data?: RenderData): void {
    const output = data ? { ...data } : { message };
    this.writeYaml(output);
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

    this.writeYaml(errorObj, true);
  }

  info(message: string, data?: RenderData): void {
    const output = data ? { info: message, ...data } : { info: message };
    this.writeYaml(output);
  }

  data(data: RenderData): void {
    this.writeYaml(data);
  }

  section(_title: string): void {
    // Sections are not relevant in YAML output; ignored
  }

  headline(_title: string): void {
    // Headlines are not relevant in YAML output; ignored
  }

  banner(_lines: string[]): void {
    // Banners are not relevant in YAML output; ignored
  }

  divider(): void {
    // Dividers are not relevant in YAML output; ignored
  }

  /**
   * Write YAML to stdout or stderr
   */
  private writeYaml(data: RenderData, isError = false): void {
    const yaml = YAML.stringify(data);

    if (isError) {
      console.error(yaml);
    } else {
      console.log(yaml);
    }
  }
}
