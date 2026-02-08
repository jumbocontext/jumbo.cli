import yaml from "yaml";

/**
 * YamlFormatter - Converts data structures to YAML format
 *
 * Uses the 'yaml' library for robust YAML serialization.
 * YAML is preferred over JSON for LLM context because it's more readable
 * and has less syntactic noise (no quotes, commas, braces everywhere).
 *
 * Configuration:
 * - indent: 2 spaces (standard YAML convention)
 * - No document markers (---) for cleaner output
 * - Preserves null values (important for optional fields)
 */
export class YamlFormatter {
  /**
   * Convert data to YAML string
   *
   * @param data - Any serializable data structure
   * @param options - Formatting options (currently supports indent)
   * @returns YAML string representation
   */
  toYaml(data: any, options?: { indent?: number }): string {
    const indent = options?.indent ?? 2;

    return yaml.stringify(data, {
      indent,
      lineWidth: 0, // Disable line wrapping
      minContentWidth: 0, // Allow content at any width
      defaultStringType: "PLAIN", // Use plain strings when possible (no quotes)
      defaultKeyType: "PLAIN", // Use plain keys when possible
      nullStr: "null", // Explicit null representation
    });
  }
}
