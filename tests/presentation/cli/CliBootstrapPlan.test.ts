import { describe, expect, it } from "@jest/globals";
import { planCliBootstrap } from "../../../src/presentation/cli/CliBootstrapPlan.js";

describe("planCliBootstrap", () => {
  it("opens the cockpit against the current project root for bare jumbo", () => {
    const plan = planCliBootstrap({
      argv: ["node", "jumbo"],
      cwd: "/repo",
      nearestProjectRoot: "/repo",
      commandRequiresInfrastructure: true,
    });

    expect(plan).toEqual({
      requiresInfrastructure: true,
      projectRoot: "/repo",
    });
  });

  it("opens the cockpit without infrastructure for bare jumbo when only an ancestor project exists", () => {
    const plan = planCliBootstrap({
      argv: ["node", "jumbo"],
      cwd: "/repo/test",
      nearestProjectRoot: "/repo",
      commandRequiresInfrastructure: false,
    });

    expect(plan).toEqual({
      requiresInfrastructure: false,
      projectRoot: null,
    });
  });

  it("opens the cockpit without infrastructure for bare jumbo when no project exists", () => {
    const plan = planCliBootstrap({
      argv: ["node", "jumbo"],
      cwd: "/repo/test",
      nearestProjectRoot: null,
      commandRequiresInfrastructure: false,
    });

    expect(plan).toEqual({
      requiresInfrastructure: false,
      projectRoot: null,
    });
  });

  it("preserves non-bare command infrastructure decisions", () => {
    const plan = planCliBootstrap({
      argv: ["node", "jumbo", "telemetry", "status"],
      cwd: "/repo/test",
      nearestProjectRoot: "/repo",
      commandRequiresInfrastructure: true,
    });

    expect(plan).toEqual({
      requiresInfrastructure: true,
      projectRoot: "/repo",
    });
  });
});
