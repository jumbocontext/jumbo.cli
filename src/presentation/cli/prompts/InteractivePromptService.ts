/**
 * InteractivePromptService
 *
 * Provides reusable interactive prompt utilities for CLI commands.
 * Uses Inquirer.js for checkbox selections and text inputs.
 * Designed to be generic and work with any entity type.
 */

import inquirer from "inquirer";
import chalk from "chalk";

/**
 * Configuration for entity selection prompts
 */
export interface EntitySelectionConfig<T> {
  /** Message displayed above the checkbox list */
  message: string;
  /** Optional suffix with additional instructions */
  suffix?: string;
  /** Function to format each entity for display */
  formatter: (entity: T) => string;
  /** Message to display when no entities are available */
  emptyMessage?: string;
}

/**
 * Result of an entity selection prompt
 */
export interface EntitySelectionResult<T> {
  /** Whether the prompt was shown (false if entities list was empty) */
  prompted: boolean;
  /** The selected entities in their original form */
  selected: T[];
}

/**
 * Configuration for text input prompts
 */
export interface TextInputConfig {
  /** Message displayed for the input */
  message: string;
  /** Optional suffix with additional instructions */
  suffix?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Custom validation function */
  validate?: (input: string) => boolean | string;
}

/**
 * Configuration for multi-value text input prompts
 */
export interface MultiTextInputConfig {
  /** Message displayed for the input */
  message: string;
  /** Optional suffix with additional instructions */
  suffix?: string;
  /** Separator for splitting input (default: comma) */
  separator?: string;
  /** Minimum number of values required (default: 0) */
  minValues?: number;
}

export class InteractivePromptService {
  /**
   * Prompts user to select multiple entities from a checkbox list.
   * Returns the selected entities in their original form.
   *
   * @param entities - Array of entities to present for selection
   * @param config - Configuration for the prompt
   * @returns Selected entities and whether the prompt was shown
   */
  async selectEntities<T>(
    entities: T[],
    config: EntitySelectionConfig<T>
  ): Promise<EntitySelectionResult<T>> {
    // Add spacing before prompt
    console.log();

    // Handle empty entity list gracefully
    if (entities.length === 0) {
      if (config.emptyMessage) {
        console.log(chalk.dim(config.emptyMessage));
      }
      return { prompted: false, selected: [] };
    }

    // Build choices with original entity stored as value
    const choices = entities.map((entity, index) => ({
      name: config.formatter(entity),
      value: index, // Store index to retrieve original entity
      short: this.truncateForShort(config.formatter(entity)),
    }));

    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selection",
        message: chalk.cyan(config.message),
        suffix: config.suffix ? `\n${chalk.dim(config.suffix)}` : undefined,
        choices,
      },
    ]);

    // Map selected indices back to original entities
    const selectedIndices: number[] = answers.selection;
    const selected = selectedIndices.map((index) => entities[index]);

    return { prompted: true, selected };
  }

  /**
   * Prompts user for a single text input.
   *
   * @param config - Configuration for the prompt
   * @returns The entered text (trimmed), or undefined if empty and not required
   */
  async textInput(config: TextInputConfig): Promise<string | undefined> {
    // Add spacing before prompt
    console.log();

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message: chalk.cyan(config.message),
        suffix: config.suffix ? `\n${chalk.dim(config.suffix)}` : undefined,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (config.required && !trimmed) {
            return "This field is required";
          }
          if (config.validate) {
            return config.validate(trimmed);
          }
          return true;
        },
      },
    ]);

    const trimmed = answers.value.trim();
    return trimmed || undefined;
  }

  /**
   * Prompts user for multiple text values via comma-separated (or custom separator) input.
   *
   * @param config - Configuration for the prompt
   * @returns Array of entered values (trimmed and filtered for empty)
   */
  async multiTextInput(config: MultiTextInputConfig): Promise<string[]> {
    // Add spacing before prompt
    console.log();

    const separator = config.separator ?? ",";
    const minValues = config.minValues ?? 0;

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message: chalk.cyan(config.message),
        suffix: config.suffix ? `\n${chalk.dim(config.suffix)}` : undefined,
        validate: (input: string) => {
          const values = this.parseMultiValue(input, separator);
          if (values.length < minValues) {
            return `At least ${minValues} value(s) required`;
          }
          return true;
        },
      },
    ]);

    return this.parseMultiValue(answers.value, separator);
  }

  /**
   * Displays an informational message (for non-interactive displays like decisions).
   *
   * @param title - Section title
   * @param items - Items to display
   * @param formatter - Function to format each item for display
   */
  displayInfo<T>(title: string, items: T[], formatter: (item: T) => string): void {
    if (items.length === 0) {
      return;
    }

    console.log();
    console.log(chalk.yellow(title));
    items.forEach((item) => {
      console.log(chalk.dim(`  - ${formatter(item)}`));
    });
  }

  /**
   * Parses a multi-value string into an array of trimmed, non-empty values.
   */
  private parseMultiValue(input: string, separator: string): string[] {
    return input
      .split(separator)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  /**
   * Truncates a string for the "short" display in checkbox selections.
   */
  private truncateForShort(text: string, maxLength: number = 40): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + "...";
  }
}
