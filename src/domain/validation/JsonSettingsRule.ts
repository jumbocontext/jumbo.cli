import type { ValidationRule, ValidationResult } from "./ValidationRule.js";

/**
 * Validates that a string is valid JSON
 *
 * @example
 * const rule = new JsonSettingsRule();
 * const result = await rule.validateAsync('{"foo": "bar"}');
 * // result.isValid === true
 *
 * const invalid = await rule.validateAsync('{invalid}');
 * // result.isValid === false
 * // result.errors === ['Invalid JSON: Unexpected token...']
 */
export class JsonSettingsRule implements ValidationRule<string> {
  async validateAsync(jsonString: string): Promise<ValidationResult> {
    try {
      JSON.parse(jsonString);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }
}
