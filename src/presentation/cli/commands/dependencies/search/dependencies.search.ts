/**
 * CLI Command: jumbo dependencies search
 *
 * Searches dependencies by identity fields, status, legacy links, and free text.
 * Filters combine with AND logic.
 */

import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { DependencySearchCriteria } from "../../../../../application/context/dependencies/search/DependencySearchCriteria.js";
import { LocalSearchDependenciesGateway } from "../../../../../application/context/dependencies/search/LocalSearchDependenciesGateway.js";
import { SearchDependenciesController } from "../../../../../application/context/dependencies/search/SearchDependenciesController.js";
import { SearchDependenciesRequest } from "../../../../../application/context/dependencies/search/SearchDependenciesRequest.js";
import { DependencyStatus, DependencyStatusType } from "../../../../../domain/dependencies/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { DependencySearchOutputBuilder, DependencySearchOutputFormat } from "./DependencySearchOutputBuilder.js";

const VALID_DEPENDENCY_STATUSES = Object.values(DependencyStatus);

export const metadata: CommandMetadata = {
  description: "Search dependencies by identity, status, links, or free-text query",
  category: "solution",
  options: [
    {
      flags: "--name <name>",
      description: "Filter by dependency display name (substring match, or use * for wildcards)",
    },
    {
      flags: "--ecosystem <ecosystem>",
      description: "Filter by ecosystem (substring match, or use * for wildcards)",
    },
    {
      flags: "--package-name <packageName>",
      description: "Filter by package name (substring match, or use * for wildcards)",
    },
    {
      flags: "--version <version>",
      description: "Filter by version constraint (substring match, or use * for wildcards)",
    },
    {
      flags: "--status <status>",
      description: "Filter by status (exact match): active, deprecated, removed",
    },
    {
      flags: "--consumer <componentId>",
      description: "Legacy filter by former consumer component ID (substring match, or use * for wildcards)",
    },
    {
      flags: "--provider <componentId>",
      description: "Legacy filter by former provider component ID (substring match, or use * for wildcards)",
    },
    {
      flags: "-q, --query <query>",
      description: "Free-text search across name, ecosystem, package, version, contract, and endpoint",
    },
    {
      flags: "-o, --output <output>",
      description: "Output detail level: default or compact",
    },
  ],
  examples: [
    {
      command: "jumbo dependencies search --ecosystem npm --query express",
      description: "Search npm dependencies using free text",
    },
    {
      command: "jumbo dependencies search --package-name \"@types/*\" --output compact",
      description: "Search dependencies with wildcard package matching",
    },
  ],
  related: ["dependencies list", "dependency add", "dependency update", "dependency remove"],
  requiresProject: true
};

export async function dependenciesSearch(
  options: {
    name?: string;
    ecosystem?: string;
    packageName?: string;
    version?: string;
    status?: string;
    consumer?: string;
    provider?: string;
    query?: string;
    output?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    if (options.status && !VALID_DEPENDENCY_STATUSES.includes(options.status as DependencyStatusType)) {
      renderer.error(`Invalid status: ${options.status}. Must be one of: ${VALID_DEPENDENCY_STATUSES.join(", ")}`);
      process.exit(1);
    }

    const outputFormat: DependencySearchOutputFormat = options.output === "compact" ? "compact" : "default";
    if (options.output && options.output !== "default" && options.output !== "compact") {
      renderer.error(`Invalid output format: ${options.output}. Must be one of: default, compact`);
      process.exit(1);
    }

    const criteria: DependencySearchCriteria = {
      ...(options.name && { name: options.name }),
      ...(options.ecosystem && { ecosystem: options.ecosystem }),
      ...(options.packageName && { packageName: options.packageName }),
      ...(options.version && { versionConstraint: options.version }),
      ...(options.status && { status: options.status as DependencyStatusType }),
      ...(options.consumer && { consumer: options.consumer }),
      ...(options.provider && { provider: options.provider }),
      ...(options.query && { query: options.query }),
    };

    const gateway = new LocalSearchDependenciesGateway(container.dependencyViewReader);
    const controller = new SearchDependenciesController(gateway);
    const request: SearchDependenciesRequest = { criteria };
    const { dependencies } = await controller.handle(request);

    const outputBuilder = new DependencySearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(dependencies, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(dependencies, outputFormat);
      const dataSection = output.getSections().find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to search dependencies", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
