import { ARGV } from "./Constants.js";

export type InitialTuiFlow = "cockpit" | "init";

export interface CliBootstrapPlanInput {
  readonly argv: readonly string[];
  readonly cwd: string;
  readonly nearestProjectRoot: string | null;
  readonly commandRequiresInfrastructure: boolean;
}

export interface CliBootstrapPlan {
  readonly initialTuiFlow: InitialTuiFlow;
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
  const currentDirectoryIsProjectRoot = nearestProjectRoot === cwd;

  const initialTuiFlow: InitialTuiFlow =
    isBareTuiInvocation && !currentDirectoryIsProjectRoot ? "init" : "cockpit";
  const requiresInfrastructure =
    commandRequiresInfrastructure || isBareTuiInvocation;

  if (!requiresInfrastructure) {
    return {
      initialTuiFlow,
      requiresInfrastructure,
      projectRoot: null,
    };
  }

  return {
    initialTuiFlow,
    requiresInfrastructure,
    projectRoot:
      isBareTuiInvocation && !currentDirectoryIsProjectRoot
        ? cwd
        : nearestProjectRoot ?? cwd,
  };
}
