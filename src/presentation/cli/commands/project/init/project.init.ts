/**
 * CLI Command: jumbo project init
 *
 * Initializes a new Jumbo project by recording the initial ProjectInitialized event.
 * By default, runs in interactive mode prompting for each field.
 * Use --non-interactive flag to provide all values via command line options.
 */

import inquirer from "inquirer";
import chalk from "chalk";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { PlannedFileChange } from "../../../../../application/context/project/init/PlannedFileChange.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { getBannerLines, showAnimatedBanner } from "../../../banner/AnimatedBanner.js";
import { ProjectLimits } from "../../../../../domain/project/Constants.js";

/**
 * Displays the planned changes in a user-friendly format
 */
function displayPlannedChanges(renderer: Renderer, changes: PlannedFileChange[]): void {
  renderer.info("\nThe following changes will be made to your project:\n");

  const creates = changes.filter((c) => c.action === "create");
  const modifies = changes.filter((c) => c.action === "modify");

  // Calculate the max path length for column alignment
  const maxPathLength = Math.max(...changes.map((c) => c.path.length));

  const renderChangeList = (items: PlannedFileChange[], symbol: string, pathColor: typeof chalk.green) => {
    items.forEach((c) => {
      const padding = " ".repeat(maxPathLength - c.path.length + 2);
      console.log(`    ${symbol} ${pathColor(c.path)}${padding}${chalk.dim(c.description)}`);
    });
  };

  if (creates.length > 0) {
    console.log(chalk.green("  Files/directories to create:"));
    renderChangeList(creates, "+", chalk.cyan);
    console.log();
  }

  if (modifies.length > 0) {
    console.log(chalk.yellow("  Files to modify (existing content will be preserved):"));
    renderChangeList(modifies, "~", chalk.cyan);
    console.log();
  }
}

/**
 * Prompts user to confirm the planned changes
 */
async function confirmChanges(): Promise<boolean> {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: "Proceed with initialization?",
      default: true,
    },
  ]);
  return answers.proceed;
}

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Initialize a new Jumbo project with AI assistant hook configuration",
  category: "project-knowledge",
  topLevelAliases: ["init"],
  options: [
    {
      flags: "-n, --name <name>",
      description: "Project name (required in non-interactive mode)"
    },
    {
      flags: "--purpose <purpose>",
      description: "High-level project purpose"
    },
    {
      flags: "--non-interactive",
      description: "Skip interactive prompts, use command line options only"
    },
    {
      flags: "--yolo",
      description: "Skip confirmation prompt and proceed with initialization"
    }
  ],
  examples: [
    {
      command: "jumbo project init",
      description: "Initialize interactively (recommended)"
    },
    {
      command: 'jumbo project init --non-interactive --name "MyProject" --purpose "AI memory management"',
      description: "Initialize without prompts using command line options"
    },
    {
      command: "jumbo project init --yolo",
      description: "Initialize interactively but skip the confirmation prompt"
    }
  ],
  related: ["project update"],
  requiresProject: false
};

/**
 * Collected project initialization values
 */
interface ProjectInitOptions {
  name: string;
  purpose?: string;
}

interface TelemetryConsentPromptAnswer {
  enabled: boolean;
}

/**
 * Prompts the user interactively for project initialization values.
 * Each field includes explanatory text to guide the user.
 */
async function promptForProjectDetails(): Promise<ProjectInitOptions> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Project name:",
      suffix: "\n  A short, memorable name for your project (e.g., 'MyApp', 'DataPipeline')\n>",
      validate: (input: string) => {
        if (!input.trim()) {
          return "Project name is required";
        }
        if (input.length > ProjectLimits.NAME_MAX_LENGTH) {
          return `Project name must be less than ${ProjectLimits.NAME_MAX_LENGTH} characters`;
        }
        return true;
      },
    },
    {
      type: "input",
      name: "purpose",
      message: "Purpose (optional):",
      suffix: "\n  The high-level goal or problem this project solves\n>",
      validate: (input: string) => {
        if (input && input.length > ProjectLimits.PURPOSE_MAX_LENGTH) {
          return `Purpose must be less than ${ProjectLimits.PURPOSE_MAX_LENGTH} characters`;
        }
        return true;
      },
    },
  ]);

  return {
    name: answers.name.trim(),
    purpose: answers.purpose?.trim() || undefined,
  };
}

async function promptForTelemetryConsentIfNeeded(
  container: IApplicationContainer,
  interactive: boolean
): Promise<void> {
  const status = await container.getTelemetryStatusController.handle({});

  if (
    status.configured
    || status.disabledByCi
    || status.disabledByEnvironment
  ) {
    return;
  }

  // Non-interactive mode: enable telemetry by default (opt-out model)
  if (!interactive || !process.stdout.isTTY) {
    await container.updateTelemetryConsentController.handle({ enabled: true });
    return;
  }

  const answers = await inquirer.prompt<TelemetryConsentPromptAnswer>([
    {
      type: "confirm",
      name: "enabled",
      message:
        "Jumbo collects anonymous usage data to help improve the product. " +
        "You can opt out later with 'jumbo telemetry disable' or JUMBO_TELEMETRY_DISABLED=1. " +
        "Allow anonymous telemetry?",
      default: true,
    },
  ]);

  await container.updateTelemetryConsentController.handle({
    enabled: answers.enabled === true,
  });
}

/**
 * Command handler - receives container like all other controllers
 */
export async function projectInit(
  options: {
    name?: string;
    purpose?: string;
    nonInteractive?: boolean;
    yolo?: boolean;
  },
  container: IApplicationContainer
) {
  // Configure renderer for onboarding (always flashy/human-friendly)
  const renderer = Renderer.configure({ forceHuman: true });

  // Show welcome banner
  if (process.stdout.isTTY) {
    const version = container.cliVersionReader.getVersion().version;
    await showAnimatedBanner([], null, version);
  } else {
    renderer.banner(getBannerLines());
  }

  // Determine project details based on mode
  let projectDetails: ProjectInitOptions;

  if (options.nonInteractive) {
    // Non-interactive mode: require --name flag
    if (!options.name) {
      renderer.error("Project name is required in non-interactive mode. Use --name <name>");
      process.exit(1);
    }
    projectDetails = {
      name: options.name,
      purpose: options.purpose,
    };
  } else {
    // Interactive mode (default): prompt for all fields
    renderer.info("Let's set up your Jumbo project. Press Enter to skip optional fields.\n");
    projectDetails = await promptForProjectDetails();
  }

  await promptForTelemetryConsentIfNeeded(container, !options.nonInteractive);

  // Get planned changes from application layer (single source of truth)
  const projectRoot = process.cwd();
  const planResponse = await container.planProjectInitController.handle({ projectRoot });
  displayPlannedChanges(renderer, planResponse.plannedChanges);

  // Ask for confirmation (unless --yolo flag is set)
  if (!options.yolo) {
    const confirmed = await confirmChanges();
    if (!confirmed) {
      renderer.info("\nInitialization cancelled.");
      process.exit(0);
    }
  }

  // Show progress header
  renderer.info("\nInitializing project...\n");

  // Execute initialization via controller
  const result = await container.initializeProjectController.handle({
    name: projectDetails.name,
    purpose: projectDetails.purpose,
    projectRoot,
  });

  // Show completion status for each change (from the result, not hardcoded)
  console.log();
  result.changes.forEach((change: PlannedFileChange) => {
    const symbol = change.action === "create" ? chalk.green("✓") : chalk.yellow("✓");
    const verb = change.action === "create" ? "Created" : "Updated";
    console.log(`  ${symbol} ${verb} ${change.path}`);
  });
  console.log();

  // Success output (verbose for onboarding)
  const data: Record<string, string> = {
    projectId: result.projectId,
    name: projectDetails.name,
  };
  if (projectDetails.purpose) {
    data.purpose = projectDetails.purpose;
  }

  renderer.success("Welcome to Jumbo! Project initialized successfully.", data);
  renderer.info("");
  renderer.info("Next steps: Create your first goal then start your coding agent.");
  renderer.info("Jumbo will guide you, then your agent, through everything.");
  renderer.info("Run 'jumbo goal add --help' to see available options for creating your first goal.");
  renderer.info("Example: 'jumbo goal add --title \"Set up database\" --objective \"Install PostgreSQL and create initial schema\" --criteria \"Database installed\" \"Initial schema created\" \"Migrations set up\"'");
}
