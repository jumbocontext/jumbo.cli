---
title: Bare Jumbo Command Flow
description: Target bootstrap and TUI state flow for running `jumbo` with no arguments.
sidebar:
  order: 1
---

# Bare `jumbo` Command Flow

This document specifies the target flow for running `jumbo` with no arguments.
It exists so the implementation can be checked against a concrete flow before
changing bootstrap or TUI behavior.

## Rules

- Bare `jumbo` always launches the TUI.
- The TUI always opens on Cockpit. There is no initial `init` TUI flow state.
- `ProjectLifecycleState` is resolved for the current working directory before
  Cockpit chooses what to render.
- An ancestor Jumbo project must not make the current directory appear initialized
  for a bare `jumbo` launch.
- If the current working directory is not an initialized Jumbo project, Cockpit
  renders the uninitialized state and may offer initialization actions.
- Project-scoped non-bare commands keep their existing guard behavior and may
  direct the user back to an ancestor project root.

## Flow Chart

```mermaid
flowchart TD
  Start([User runs jumbo]) --> ReadVersion[Read CLI version]
  ReadVersion --> Classify{Invocation has arguments?}

  Classify -->|Yes| CommandFlow[Use command classifier and command bootstrap flow]
  CommandFlow --> RequiresProject{Command requires an initialized project?}
  RequiresProject -->|No| CommandInfra[Build required infrastructure according to command metadata]
  RequiresProject -->|Yes| NearestProject{Is cwd the nearest Jumbo project root?}
  NearestProject -->|Yes| CommandInfra
  NearestProject -->|No, ancestor exists| RejectAncestor[Print change-directory guidance and exit non-zero]
  NearestProject -->|No project found| RejectMissing[Print project-not-found guidance and exit non-zero]
  CommandInfra --> RunCommand[AppRunner executes Commander command]

  Classify -->|No| BareFlow[Use bare TUI bootstrap flow]
  BareFlow --> BuildCwdHost[Build TUI-capable Host scoped to cwd]
  BuildCwdHost --> ResolveLifecycle[Resolve ProjectLifecycleState for cwd]
  ResolveLifecycle --> LaunchTui[Launch TUI on Cockpit with lifecycle state and action controllers]
  LaunchTui --> RouteLifecycle{ProjectLifecycleState}

  RouteLifecycle -->|uninitialized| CockpitUninitialized[Cockpit renders uninitialized state]
  RouteLifecycle -->|unprimed| CockpitUnprimed[Cockpit renders unprimed state]
  RouteLifecycle -->|primed-empty| CockpitPrimedEmpty[Cockpit renders primed-empty state]
  RouteLifecycle -->|primed| CockpitPrimed[Cockpit renders primed state]

  CockpitUninitialized --> TuiReady([TUI ready])
  CockpitUnprimed --> TuiReady
  CockpitPrimedEmpty --> TuiReady
  CockpitPrimed --> TuiReady
```

## Implementation Checkpoints

- `AppRunner` should construct the TUI launcher with only version and container.
- `TuiApplicationLauncher` should not accept or pass an initial flow prop.
- `TuiApp` should initialize Cockpit as the default screen and keep Init as a
  user-triggered overlay.
- Bare `jumbo` bootstrap should resolve and pass/read a `ProjectLifecycleState`
  scoped to `cwd`; it should not let `findNearest()` make a non-project `cwd`
  inherit an ancestor project's lifecycle.
- Tests should cover these three bare-launch cases:
  - `cwd` is an initialized project root: Cockpit uses project-backed state.
  - `cwd` is inside an ancestor project but is not itself the project root:
    Cockpit uses `cwd` uninitialized state.
  - `cwd` has no ancestor project: Cockpit uses `cwd` uninitialized state.
