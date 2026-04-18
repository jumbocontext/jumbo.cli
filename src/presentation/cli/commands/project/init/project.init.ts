/**
 * CLI Command: jumbo project init
 *
 * Initializes a new Jumbo project by recording the initial ProjectInitialized event.
 * By default, runs in interactive mode prompting for each field.
 * Use --non-interactive flag to provide all values via command line options.
 */

import inquirer from "inquirer";
import { Colors, Symbols } from "../../../rendering/StyleConfig.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AgentId, AvailableAgent } from "../../../../../application/context/project/init/AgentSelection.js";
import { PlannedFileChange } from "../../../../../application/context/project/init/PlannedFileChange.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { getBannerLines, showAnimatedBanner } from "../../../banner/AnimatedBanner.js";
import { ProjectLimits } from "../../../../../domain/project/Constants.js";
import { AudienceLimits, AudiencePriority, AudiencePriorityType } from "../../../../../domain/audiences/Constants.js";
import { AudiencePainLimits } from "../../../../../domain/audience-pains/Constants.js";
import { ValuePropositionLimits } from "../../../../../domain/value-propositions/Constants.js";

/**
 * Displays the planned changes in a user-friendly format
 */
function displayPlannedChanges(renderer: Renderer, changes: PlannedFileChange[]): void {
  renderer.info("\nThe following changes will be made to your project:\n");

  const creates = changes.filter((c) => c.action === "create");
  const modifies = changes.filter((c) => c.action === "modify");

  // Calculate the max path length for column alignment
  const maxPathLength = Math.max(...changes.map((c) => c.path.length));

  const renderChangeList = (items: PlannedFileChange[], symbol: string, pathColor: (s: string) => string) => {
    items.forEach((c) => {
      const padding = " ".repeat(maxPathLength - c.path.length + 2);
      console.log(`    ${symbol} ${pathColor(c.path)}${padding}${Colors.dim(c.description)}`);
    });
  };

  if (creates.length > 0) {
    console.log(Colors.success("  Files/directories to create:"));
    renderChangeList(creates, "+", Colors.accent);
    console.log();
  }

  if (modifies.length > 0) {
    console.log(Colors.warning("  Files to modify (existing content will be preserved):"));
    renderChangeList(modifies, "~", Colors.accent);
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

async function promptForAgentSelection(
  availableAgents: readonly AvailableAgent[]
): Promise<readonly AgentId[]> {
  if (availableAgents.length === 0) {
    return [];
  }

  const answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedAgentIds",
      message: "Select agents to configure:",
      choices: availableAgents.map((agent) => ({
        name: agent.name,
        value: agent.id,
        checked: true,
      })),
      validate: (input: readonly AgentId[]) => {
        if (input.length === 0) {
          return "Select at least one agent";
        }
        return true;
      },
    },
  ]);

  return answers.selectedAgentIds;
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
    },
    {
      flags: "--audience-name <name>",
      description: "Target audience name (non-interactive mode)"
    },
    {
      flags: "--audience-description <description>",
      description: "Target audience description (non-interactive mode)"
    },
    {
      flags: "--audience-priority <priority>",
      description: "Target audience priority: primary, secondary, tertiary (non-interactive mode)"
    },
    {
      flags: "--pain-title <title>",
      description: "Audience pain point title (non-interactive mode)"
    },
    {
      flags: "--pain-description <description>",
      description: "Audience pain point description (non-interactive mode)"
    },
    {
      flags: "--value-title <title>",
      description: "Value proposition title (non-interactive mode)"
    },
    {
      flags: "--value-description <description>",
      description: "Value proposition description (non-interactive mode)"
    },
    {
      flags: "--value-benefit <benefit>",
      description: "Value proposition benefit (non-interactive mode)"
    },
    {
      flags: "--value-measurable-outcome <outcome>",
      description: "Value proposition measurable outcome (non-interactive mode)"
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
      command: 'jumbo project init --non-interactive --name "MyProject" --audience-name "Developers" --audience-description "Software developers" --audience-priority primary',
      description: "Initialize with audience in non-interactive mode"
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

interface AudienceOptions {
  name: string;
  description: string;
  priority: AudiencePriorityType;
}

interface AudiencePainOptions {
  title: string;
  description: string;
}

interface ValuePropositionOptions {
  title: string;
  description: string;
  benefit: string;
  measurableOutcome?: string;
}

interface PrimitiveOptions {
  audiences: AudienceOptions[];
  audiencePains: AudiencePainOptions[];
  valuePropositions: ValuePropositionOptions[];
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

/**
 * Prompts the user to optionally define target audiences.
 * Loops with "Add another?" until the user declines.
 */
async function promptForAudiences(): Promise<AudienceOptions[]> {
  const audiences: AudienceOptions[] = [];

  const { defineAudience } = await inquirer.prompt([
    {
      type: "confirm",
      name: "defineAudience",
      message: "Define a target audience?",
      suffix: "\n  Who is this project for? (you can add more later)\n>",
      default: true,
    },
  ]);

  if (!defineAudience) return audiences;

  let addMore = true;
  while (addMore) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Audience name:",
        suffix: "\n  A short label for this audience (e.g., 'Software Developers')\n>",
        validate: (input: string) => {
          if (!input.trim()) return "Audience name is required";
          if (input.length > AudienceLimits.NAME_MAX_LENGTH) {
            return `Audience name must be less than ${AudienceLimits.NAME_MAX_LENGTH} characters`;
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "Audience description:",
        suffix: "\n  Who they are and what they do\n>",
        validate: (input: string) => {
          if (!input.trim()) return "Audience description is required";
          if (input.length > AudienceLimits.DESCRIPTION_MAX_LENGTH) {
            return `Audience description must be less than ${AudienceLimits.DESCRIPTION_MAX_LENGTH} characters`;
          }
          return true;
        },
      },
      {
        type: "list",
        name: "priority",
        message: "Audience priority:",
        choices: [
          { name: "Primary", value: AudiencePriority.PRIMARY },
          { name: "Secondary", value: AudiencePriority.SECONDARY },
          { name: "Tertiary", value: AudiencePriority.TERTIARY },
        ],
        default: AudiencePriority.PRIMARY,
      },
    ]);

    audiences.push({
      name: answers.name.trim(),
      description: answers.description.trim(),
      priority: answers.priority,
    });

    const { another } = await inquirer.prompt([
      {
        type: "confirm",
        name: "another",
        message: "Add another audience?",
        default: false,
      },
    ]);
    addMore = another;
  }

  return audiences;
}

/**
 * Prompts the user to optionally define audience pain points.
 * Loops with "Add another?" until the user declines.
 */
async function promptForAudiencePains(): Promise<AudiencePainOptions[]> {
  const pains: AudiencePainOptions[] = [];

  const { definePain } = await inquirer.prompt([
    {
      type: "confirm",
      name: "definePain",
      message: "Define an audience pain point?",
      suffix: "\n  What problem does this project solve? (you can add more later)\n>",
      default: true,
    },
  ]);

  if (!definePain) return pains;

  let addMore = true;
  while (addMore) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "Pain point title:",
        suffix: "\n  A brief title for the pain point (e.g., 'Context loss between sessions')\n>",
        validate: (input: string) => {
          if (!input.trim()) return "Pain title is required";
          if (input.length > AudiencePainLimits.TITLE_MAX_LENGTH) {
            return `Pain title must be less than ${AudiencePainLimits.TITLE_MAX_LENGTH} characters`;
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "Pain point description:",
        suffix: "\n  Detailed description of the problem\n>",
        validate: (input: string) => {
          if (!input.trim()) return "Pain description is required";
          if (input.length > AudiencePainLimits.DESCRIPTION_MAX_LENGTH) {
            return `Pain description must be less than ${AudiencePainLimits.DESCRIPTION_MAX_LENGTH} characters`;
          }
          return true;
        },
      },
    ]);

    pains.push({
      title: answers.title.trim(),
      description: answers.description.trim(),
    });

    const { another } = await inquirer.prompt([
      {
        type: "confirm",
        name: "another",
        message: "Add another pain point?",
        default: false,
      },
    ]);
    addMore = another;
  }

  return pains;
}

/**
 * Prompts the user to optionally define value propositions.
 * Loops with "Add another?" until the user declines.
 */
async function promptForValuePropositions(): Promise<ValuePropositionOptions[]> {
  const values: ValuePropositionOptions[] = [];

  const { defineValue } = await inquirer.prompt([
    {
      type: "confirm",
      name: "defineValue",
      message: "Define a value proposition?",
      suffix: "\n  What value does this project deliver? (you can add more later)\n>",
      default: true,
    },
  ]);

  if (!defineValue) return values;

  let addMore = true;
  while (addMore) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "Value proposition title:",
        suffix: "\n  A short title (e.g., 'Persistent context across sessions')\n>",
        validate: (input: string) => {
          if (!input.trim()) return "Value proposition title is required";
          if (input.length > ValuePropositionLimits.TITLE_MAX_LENGTH) {
            return `Title must be less than ${ValuePropositionLimits.TITLE_MAX_LENGTH} characters`;
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "Value proposition description:",
        suffix: "\n  Detailed explanation of the value\n>",
        validate: (input: string) => {
          if (!input.trim()) return "Description is required";
          if (input.length > ValuePropositionLimits.DESCRIPTION_MAX_LENGTH) {
            return `Description must be less than ${ValuePropositionLimits.DESCRIPTION_MAX_LENGTH} characters`;
          }
          return true;
        },
      },
      {
        type: "input",
        name: "benefit",
        message: "Benefit:",
        suffix: "\n  How this improves the situation\n>",
        validate: (input: string) => {
          if (!input.trim()) return "Benefit is required";
          if (input.length > ValuePropositionLimits.BENEFIT_MAX_LENGTH) {
            return `Benefit must be less than ${ValuePropositionLimits.BENEFIT_MAX_LENGTH} characters`;
          }
          return true;
        },
      },
      {
        type: "input",
        name: "measurableOutcome",
        message: "Measurable outcome (optional):",
        suffix: "\n  How success is measured\n>",
        validate: (input: string) => {
          if (input && input.length > ValuePropositionLimits.MEASURABLE_OUTCOME_MAX_LENGTH) {
            return `Measurable outcome must be less than ${ValuePropositionLimits.MEASURABLE_OUTCOME_MAX_LENGTH} characters`;
          }
          return true;
        },
      },
    ]);

    values.push({
      title: answers.title.trim(),
      description: answers.description.trim(),
      benefit: answers.benefit.trim(),
      measurableOutcome: answers.measurableOutcome?.trim() || undefined,
    });

    const { another } = await inquirer.prompt([
      {
        type: "confirm",
        name: "another",
        message: "Add another value proposition?",
        default: false,
      },
    ]);
    addMore = another;
  }

  return values;
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
    audienceName?: string;
    audienceDescription?: string;
    audiencePriority?: AudiencePriorityType;
    painTitle?: string;
    painDescription?: string;
    valueTitle?: string;
    valueDescription?: string;
    valueBenefit?: string;
    valueMeasurableOutcome?: string;
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

  // Determine project details and primitives based on mode
  let projectDetails: ProjectInitOptions;
  let primitives: PrimitiveOptions = { audiences: [], audiencePains: [], valuePropositions: [] };
  let selectedAgentIds: readonly AgentId[] | undefined;

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

    // Collect primitives from CLI flags
    if (options.audienceName && options.audienceDescription && options.audiencePriority) {
      primitives.audiences.push({
        name: options.audienceName,
        description: options.audienceDescription,
        priority: options.audiencePriority,
      });
    }
    if (options.painTitle && options.painDescription) {
      primitives.audiencePains.push({
        title: options.painTitle,
        description: options.painDescription,
      });
    }
    if (options.valueTitle && options.valueDescription && options.valueBenefit) {
      primitives.valuePropositions.push({
        title: options.valueTitle,
        description: options.valueDescription,
        benefit: options.valueBenefit,
        measurableOutcome: options.valueMeasurableOutcome,
      });
    }
  } else {
    // Interactive mode (default): prompt for all fields
    renderer.info("Let's set up your Jumbo project. Press Enter to skip optional fields.\n");
    projectDetails = await promptForProjectDetails();
    primitives.audiences = await promptForAudiences();
    primitives.audiencePains = await promptForAudiencePains();
    primitives.valuePropositions = await promptForValuePropositions();
  }

  await promptForTelemetryConsentIfNeeded(container, !options.nonInteractive);

  const projectRoot = process.cwd();
  const initialPlanResponse = await container.planProjectInitController.handle({ projectRoot });

  if (!options.nonInteractive) {
    selectedAgentIds = await promptForAgentSelection(initialPlanResponse.availableAgents);
  }

  const planResponse = options.nonInteractive
    ? initialPlanResponse
    : await container.planProjectInitController.handle({
      projectRoot,
      selectedAgentIds,
    });

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
    selectedAgentIds,
  });

  // Show completion status for each change (from the result, not hardcoded)
  console.log();
  result.changes.forEach((change: PlannedFileChange) => {
    const symbol = change.action === "create" ? Colors.success(Symbols.check) : Colors.warning(Symbols.check);
    const verb = change.action === "create" ? "Created" : "Updated";
    console.log(`  ${symbol} ${verb} ${change.path}`);
  });

  // Persist primitives via existing controllers
  const registered: string[] = [];

  for (const audience of primitives.audiences) {
    await container.addAudienceController.handle(audience);
    registered.push(`Audience: ${audience.name}`);
  }

  for (const pain of primitives.audiencePains) {
    await container.addAudiencePainController.handle(pain);
    registered.push(`Pain: ${pain.title}`);
  }

  for (const value of primitives.valuePropositions) {
    await container.addValuePropositionController.handle(value);
    registered.push(`Value: ${value.title}`);
  }

  if (registered.length > 0) {
    console.log();
    registered.forEach((item) => {
      console.log(`  ${Colors.success(Symbols.check)} Registered ${item}`);
    });
  }

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

  // Conditional next steps based on which primitives were provided
  const skipped: string[] = [];
  if (primitives.audiences.length === 0) skipped.push("audiences ('jumbo audience add')");
  if (primitives.audiencePains.length === 0) skipped.push("pain points ('jumbo audience-pain add')");
  if (primitives.valuePropositions.length === 0) skipped.push("value propositions ('jumbo value add')");

  if (skipped.length > 0) {
    renderer.info(`Consider defining: ${skipped.join(", ")}`);
    renderer.info("");
  }

  renderer.info("Next steps: Create your first goal then start your coding agent.");
  renderer.info("Jumbo will guide you, then your agent, through everything.");
  renderer.info("Run 'jumbo goal add --help' to see available options for creating your first goal.");
  renderer.info("Example: 'jumbo goal add --title \"Set up database\" --objective \"Install PostgreSQL and create initial schema\" --criteria \"Database installed\" \"Initial schema created\" \"Migrations set up\"'");
}
