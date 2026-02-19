# Gateway Refactor Template

Use this prompt to refactor a CLI command flow to the canonical Controller → Gateway pattern.

---

## Prompt

Refactor the **[COMMAND NAME]** flow to follow the canonical Controller → Gateway pattern established by `GetSessionsController` / `IGetSessionsGateway` / `LocalGetSessionsGateway`.

### Reference implementation

Study these files as the reference pattern:

- `src/application/context/sessions/get/GetSessionsRequest.ts` — typed request DTO
- `src/application/context/sessions/get/GetSessionsResponse.ts` — typed response DTO
- `src/application/context/sessions/get/IGetSessionsGateway.ts` — gateway interface (application layer)
- `src/application/context/sessions/get/GetSessionsController.ts` — controller that delegates to gateway
- `src/application/context/sessions/get/LocalGetSessionsGateway.ts` — local gateway implementation (application layer — only depends on ports)
- `src/infrastructure/host/HostBuilder.ts` — wiring: LocalGateway → Controller → Container
- `src/presentation/cli/commands/sessions/list/sessions.list.ts` — CLI command that calls controller

### End-state file checklist

After refactoring, the following files must exist. Replace `{UseCaseName}` with the PascalCase use case name (e.g., `StartGoal`, `PauseWork`, `EndSession`), and `{domain}` / `{action}` with the domain path segments (e.g., `goals/start`, `work/pause`, `sessions/end`).

#### Application layer — `src/application/context/{domain}/{action}/`

| File | Category | Description |
|---|---|---|
| `{UseCaseName}Request.ts` | **DTO** | `export interface {UseCaseName}Request { readonly ...; }` — typed input. Can be empty (`{}`) if the use case takes no parameters. |
| `{UseCaseName}Response.ts` | **DTO** | `export interface {UseCaseName}Response { readonly ...; }` — typed output carrying the result. |
| `I{UseCaseName}Gateway.ts` | **Gateway interface** | `export interface I{UseCaseName}Gateway { {useCaseName}(request: {UseCaseName}Request): Promise<{UseCaseName}Response>; }` — one method named for the use case, not generic `handle`. |
| `{UseCaseName}Controller.ts` | **Controller** | Class with `constructor(private readonly gateway: I{UseCaseName}Gateway)` and `async handle(request): Promise<response>` that delegates to `this.gateway.{useCaseName}(request)`. May orchestrate additional logic (e.g., instruction building) before/after the gateway call. |

#### Application layer — `src/application/context/{domain}/{action}/` (continued)

| File | Category | Description |
|---|---|---|
| `Local{UseCaseName}Gateway.ts` | **Local gateway** | `implements I{UseCaseName}Gateway`. Constructor injects the `*CommandHandler` (for write-side orchestration) and any readers needed for response building (e.g., `I*ViewReader`). **The gateway delegates command execution to the existing CommandHandler, then fetches updated views and assembles the typed response DTO.** The CommandHandler is kept as-is — it owns the write-side orchestration (load → rehydrate → domain logic → persist → publish). The gateway owns the request/response adaptation layer on top. Lives in the **application layer** because it has no infrastructure dependencies — only ports and domain types. |

#### Infrastructure layer — `src/infrastructure/context/{domain}/{action}/` (future)

| File | Category | Description |
|---|---|---|
| `Remote{UseCaseName}Gateway.ts` | **Remote gateway** | `implements I{UseCaseName}Gateway`. Calls an external service (HTTP, gRPC, etc.) to fulfill the use case. Lives in the **infrastructure layer** because it depends on concrete infrastructure types (HTTP clients, serialization, external service contracts). |

#### Wiring — existing files to update

| File | Change |
|---|---|
| `src/application/host/IApplicationContainer.ts` | Add `{useCaseName}Controller: {UseCaseName}Controller` to the interface. The gateway is an internal wiring detail — not exposed on the container. |
| `src/infrastructure/host/HostBuilder.ts` | Import `Local{UseCaseName}Gateway` and `{UseCaseName}Controller`. Instantiate the local gateway with its dependencies, pass it to the controller constructor, add the controller to the container object. |
| `src/presentation/cli/commands/{command-path}/{command}.ts` | Replace direct handler/reader usage with `container.{useCaseName}Controller.handle(request)`. The CLI command constructs the typed request and destructures the typed response. |

#### Tests

| File | What it tests |
|---|---|
| `tests/application/context/{domain}/{action}/{UseCaseName}Controller.test.ts` | Mock `I{UseCaseName}Gateway`, verify controller delegates correctly. |
| `tests/application/context/{domain}/{action}/Local{UseCaseName}Gateway.test.ts` | Mock the reader/handler dependencies, verify the local gateway delegates correctly. |
| `tests/presentation/cli/commands/{command-path}/{command}.test.ts` | Update to mock the controller (not the reader/handler). |

### Key invariants

1. **CLI commands never touch readers, handlers, or gateways directly** — they only call `controller.handle(request)`.
2. **Controllers never touch persistence** — they delegate through the gateway interface.
3. **Gateway layer placement follows the dependency rule** — gateway interfaces live in the application layer. `Local*Gateway` implementations that only depend on ports and domain types also live in the application layer. `Remote*Gateway` implementations that depend on concrete infrastructure (HTTP, gRPC, etc.) live in the infrastructure layer.
4. **One method per gateway**, named for the use case (e.g., `getSessions`, `startGoal`), not generic `handle` or `execute`.
5. **Gateway is invisible to the container** — only the controller is exposed on `IApplicationContainer`.
6. **Naming is symmetric**: `I{UseCaseName}Gateway` / `Local{UseCaseName}Gateway` / `Remote{UseCaseName}Gateway` (future).

### Verification

- `npx tsc --noEmit` passes
- All related tests pass
- Register new components with `jumbo component add` (controller as `service`, gateway interface as `lib`, local gateway as `service`, request/response as `lib`)
