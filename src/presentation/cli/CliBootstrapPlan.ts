import { ARGV } from "./Constants.js";

export interface CliBootstrapPlanInput {
  readonly argv: readonly string[];
  readonly cwd: string;
  readonly nearestProjectRoot: string | null;
  readonly commandRequiresInfrastructure: boolean;
}

export interface CliBootstrapPlan {
  readonly requiresInfrastructure: boolean;
  readonly projectRoot: string | null;
}

export function planCliBootstrap({
  argv,
  cwd,
  nearestProjectRoot,
  commandRequiresInfrastructure,
}: CliBootstrapPlanInput): CliBootstrapPlan {
  const isBareTuiInvocation = argv.length === ARGV.NODE_AND_SCRIPT_ARG_COUNT;
  const requiresInfrastructure =
    commandRequiresInfrastructure || isBareTuiInvocation;

  if (isBareTuiInvocation) {
    const cwdIsProjectRoot = nearestProjectRoot === cwd;
    return {
      requiresInfrastructure: cwdIsProjectRoot,
      projectRoot: cwdIsProjectRoot ? cwd : null,
    };
  }

  if (!requiresInfrastructure) {
    return {
      requiresInfrastructure,
      projectRoot: null,
    };
  }

  return {
    requiresInfrastructure,
    projectRoot: nearestProjectRoot ?? cwd,
  };
}
