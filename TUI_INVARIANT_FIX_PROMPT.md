# Prompt: Fix TUI Invariant Violations

Audit and fix the confirmed invariant violations in `src/presentation/tui`.

## Scope

Work only in the TUI presentation namespace and directly supporting abstractions needed to preserve clean architecture boundaries:

- `src/presentation/tui/**`
- Corresponding tests needed for changed behavior
- Application-layer ports or bootstrap wiring only when required to remove presentation coupling to concrete infrastructure

Avoid broad refactors outside this scope.

## Issues To Fix

### 1. Decompose oversized TUI modules

Fix confirmed decomposition and single-responsibility violations:

- `src/presentation/tui/cockpit/CockpitLaunchpadView.tsx` is too large and mixes daemon selection UI, daemon configuration, event normalization, event formatting, glyph animation, seeded random generation, and status presentation.
- `src/presentation/tui/project-initialization/InitFlow.tsx`, `src/presentation/tui/wizard/Wizard.tsx`, `src/presentation/tui/billboard/AnimatedBillboard.tsx`, and `src/presentation/tui/application-shell/TuiApp.tsx` should be reviewed for practical extraction points.

Prefer extracting cohesive presentation components and pure formatting/rendering helpers into domain-named files near the code that uses them. Keep related code colocated by feature. Do not create `utils`, `services`, `helpers`, `managers`, or other catch-all folders.

### 2. Move subprocess process-control behind a replaceable boundary

`src/presentation/tui/daemon-subprocesses/TuiSubprocessManager.ts` currently owns Node process-control details (`node:child_process`, `path`, `process`, `taskkill`, `SIGTERM`) inside presentation, and `TuiApplicationLauncher` constructs it directly.

Refactor so process-control details are behind a replaceable abstraction. Presentation should depend on an interface/port and receive an implementation through composition/bootstrap rather than constructing the concrete process-control adapter inline.

Preserve existing behavior:

- Spawn reviewer/refiner/codifier daemons with the same config semantics.
- Capture stdout/stderr ring buffers.
- Record daemon lifecycle events.
- Log subprocess start, stop, stdout, stderr, close, and error events through `ILogger`.
- Preserve Windows tree termination behavior and non-Windows process-group termination behavior.

### 3. Centralize daemon names and default daemon config

Remove repeated daemon literals and duplicated defaults from:

- `src/presentation/tui/daemon-subprocesses/ISubprocessManager.ts`
- `src/presentation/tui/daemon-subprocesses/NoOpSubprocessManager.ts`
- `src/presentation/tui/daemon-subprocesses/TuiSubprocessManager.ts`
- `src/presentation/tui/cockpit/CockpitLaunchpadView.tsx`

Use type inference where possible and named constants where explicit values are required. Keep constants in a domain-named file, not a generic shared utility location.

### 4. Add focused coverage for changed components

Add or update tests for behavior touched by the refactor:

- Extracted cockpit launchpad helpers/components.
- Subprocess boundary behavior.
- Shared daemon constants/default config behavior where useful.

## Invariants To Satisfy

- Names must be explicit and self-documenting.
- Clean Screaming Architecture.
- Single Responsibility.
- Dependency Inversion.
- Replaceability Invariant.
- No junk drawers.
- Decomposition where possible.
- Common Closure Principle.
- No magic strings: use type inference where possible, constants where not.
- All touched components must have appropriate unit coverage.

### Invariant Details
```json
{
    "invariants": [
        {
            "invariantId": "inv_6b2f54c7-04af-4713-a1c2-046cd4fe61e3",
            "title": "Infrastructure Isolation",
            "description": "Domain models must never contain infrastructure concerns like database IDs, sequence numbers, or file paths",
            "rationale": "Maintains clean architecture dependency rules and allows storage implementations to be swapped",
            "createdAt": "2025-11-22T00:29:31.441Z",
            "updatedAt": "2025-11-22T00:29:31.441Z"
        },
        {
            "invariantId": "inv_3592e271-3458-4b20-8bed-20811aa0d366",
            "title": "Names must be explicit and self-documenting",
            "description": "A reader should understand what a class, file, or identifier does from its name alone—including its architectural role. Never require code inspection to decipher purpose. Examples: AddComponentCommandHandler (not AddComponentHandler), GoalProjectionStore (not GoalStore), SessionStartedEvent (not SessionStarted).",
            "rationale": "Clear naming distinguishes between command handlers (perform actions) and event handlers (react to events), preventing confusion about responsibility and purpose.",
            "createdAt": "2025-11-26T18:35:16.810Z",
            "updatedAt": "2025-12-05T23:26:38.337Z"
        },
        {
            "invariantId": "inv_dfe5ea11-34ad-440e-88ff-b7905a239215",
            "title": "Clean Screaming Architecture",
            "description": "Layered boundaries (Domain -> Application -> Infrastructure -> Presentation). Inside each layer the naming of directories and files should SCREAM what the domain is and each pieces role in the domain",
            "rationale": "Clear architectural intent and maintainability",
            "createdAt": "2025-12-06T15:47:14.018Z",
            "updatedAt": "2025-12-06T15:47:14.018Z"
        },
        {
            "invariantId": "inv_8344c9c7-3f4a-4e72-9c67-624af6ed0ef0",
            "title": "Single Responsibility",
            "description": "One repository per aggregate. Each class/module has one reason to change",
            "rationale": "SOLID principle - maintainability and testability",
            "createdAt": "2025-12-06T15:47:30.087Z",
            "updatedAt": "2025-12-06T15:47:30.087Z"
        },
        {
            "invariantId": "inv_06ef54f1-7c05-49e2-8485-58950eff5d21",
            "title": "Dependency Inversion",
            "description": "Depend on abstractions, not concretions. Application depends only on abstractions. Infrastructure implements those abstractions",
            "rationale": "SOLID principle - flexibility and testability",
            "createdAt": "2025-12-06T15:47:55.956Z",
            "updatedAt": "2025-12-06T15:47:55.956Z"
        },
        {
            "invariantId": "inv_52370755-18aa-42d6-a562-7fb67c2ad7fd",
            "title": "One class per file",
            "description": "Each TypeScript file contains exactly one class definition",
            "rationale": "Maintainability and clear code organization",
            "createdAt": "2025-12-06T15:49:58.401Z",
            "updatedAt": "2025-12-06T15:49:58.401Z"
        },
        {
            "invariantId": "inv_d17f893f-fc28-48fc-a762-395ec9d8670e",
            "title": "No junk drawers",
            "description": "NO services/, utils/, managers/, repositories/ catch-alls. Code should be organized by domain concept, not technical category",
            "rationale": "Clear domain boundaries and discoverability",
            "createdAt": "2025-12-06T15:50:52.552Z",
            "updatedAt": "2025-12-06T15:50:52.552Z"
        },
        {
            "invariantId": "inv_fa05604f-0ac7-4f63-bf75-e31a66dd9a63",
            "title": "Decomposition where possible",
            "description": "Dont have protocols that perform 10 categories of work that require test files that are 5000 lines long. Maintain a unit of work where possible and keep corresponding test file small",
            "rationale": "Testability and maintainability",
            "createdAt": "2025-12-06T15:51:13.706Z",
            "updatedAt": "2025-12-06T15:51:13.706Z"
        },
        {
            "invariantId": "inv_2e7b1c95-2f63-4315-b40b-d88827c71d57",
            "title": "Common Closure Principle",
            "description": "Things that change together, live together. Related code should be co-located",
            "rationale": "Minimize coupling, maximize cohesion",
            "createdAt": "2025-12-06T15:51:21.869Z",
            "updatedAt": "2025-12-06T15:51:21.869Z"
        },
        {
            "invariantId": "inv_75348802-f4aa-4fef-b1a0-a10423de8cc7",
            "title": "Replaceability Invariant",
            "description": "Any infrastructure component must be replaceable with an alternative implementation without modifying code in presentation, application, or domain layers.",
            "rationale": "Ensures Clean Architecture dependency rules are followed. Infrastructure is a detail, not an architectural dependency. Violations couple the application to specific technologies, making changes costly and error-prone.",
            "createdAt": "2025-12-08T19:25:55.581Z",
            "updatedAt": "2025-12-08T19:25:55.581Z"
        },
        {
            "invariantId": "inv_c46f61a5-9414-4036-bfcd-2f5595fc96a0",
            "title": "No magic strings - Use type inference where possible, constants where not",
            "description": "Magic strings and numbers scattered through code create maintenance burdens. When flag names, numeric thresholds, or other literals appear in multiple places, changing them requires hunting through the entire codebase. Use TypeScript's type inference where possible. Where explicit values are needed, define them as named constants in a shared location.",
            "rationale": "Reduces coupling, prevents errors from inconsistent values, and makes changes require only updating a single constant definition",
            "createdAt": "2026-02-11T16:06:29.305Z",
            "updatedAt": "2026-02-11T16:06:29.305Z"
        },
        {
            "invariantId": "inv_da6367cd-2404-49d1-9e1d-203b6a3d99ab",
            "title": "Test file names and namespaces must mirror src/ structure",
            "description": "Test files in tests/ must follow the same directory structure and naming as their corresponding source files in src/. For example, src/application/goals/add/AddGoalCommandHandler.ts must have its test at tests/application/goals/add/AddGoalCommandHandler.test.ts. Namespace symmetry makes tests discoverable and reinforces architectural boundaries.",
            "rationale": "Asymmetric test locations hide coverage gaps, make navigation harder, and obscure which layer a test validates. Symmetry ensures tests are immediately locatable from source and vice versa.",
            "createdAt": "2026-02-21T21:06:38.534Z",
            "updatedAt": "2026-02-21T21:06:38.534Z"
        }
    ]
}
```

## Verification

Run the focused tests for touched files, then run the full test/build command available for this repository if practical:

- `npm test`
- `npm run build`

Report any commands that could not be run and why.
