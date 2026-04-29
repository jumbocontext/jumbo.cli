/**
 * CLI Command: jumbo guideline add
 *
 * Captures an execution guideline for the project (testing, style, process, etc.).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddGuidelineRequest } from "../../../../../application/context/guidelines/add/AddGuidelineRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GuidelineCategoryValue } from "../../../../../domain/guidelines/Constants.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add an execution guideline (testing, style, process, etc.)",
  category: "solution",
  requiredOptions: [
    {
      flags: "-c, --category <category>",
      description: "Category (testing, codingStyle, process, communication, documentation, security, performance, other)"
    },
    {
      flags: "-t, --title <title>",
      description: "Guideline title"
    },
    {
      flags: "-d, --description <description>",
      description: "Detailed guideline description"
    },
    {
      flags: "--rationale <rationale>",
      description: "Why this guideline is important"
    }
  ],
  options: [
    {
      flags: "--example <path...>",
      description: "Example file paths demonstrating the guideline (optional, repeatable)"
    }
  ],
  examples: [
    {
      command: "jumbo guideline add --category testing --title '80% coverage required' --description 'All new features must have at least 80% test coverage' --rationale 'Ensures code quality and reduces bugs'",
      description: "Add a testing guideline"
    },
    {
      command: "jumbo guideline add --category codingStyle --title 'Use TypeScript strict mode' --description 'All TypeScript files must use strict mode' --rationale 'Catches type errors early' --example tsconfig.json --example src/domain/shared/BaseAggregate.ts",
      description: "Add a coding style guideline with examples"
    }
  ],
  related: ["guideline update", "guideline remove", "invariant add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelineAdd(options: {
  category: GuidelineCategoryValue;
  title: string;
  description: string;
  rationale: string;
  example?: string[];
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddGuidelineRequest = {
      category: options.category,
      title: options.title,
      description: options.description,
      rationale: options.rationale,
      examples: options.example
    };

    const { guidelineId } = await container.addGuidelineController.handle(request);

    const data: Record<string, string | number> = {
      guidelineId,
      category: options.category,
      title: options.title,
    };
    if (options.example && options.example.length > 0) {
      data.examples = options.example.length;
    }

    renderer.success(`Guideline '${categoryLabel(options.category)}: ${options.title}' added`, data);
  } catch (error) {
    renderer.error("Failed to add guideline", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    testing: "Testing",
    codingStyle: "Coding Style",
    process: "Process",
    communication: "Communication",
    documentation: "Documentation",
    security: "Security",
    performance: "Performance",
    other: "Other"
  };
  return labels[category] || category;
}
