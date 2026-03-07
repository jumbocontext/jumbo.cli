---
title: Telemetry
description: How Jumbo's anonymous telemetry works, what it collects, and how to debug, test, and configure it.
sidebar:
  order: 6
---

# Telemetry

Jumbo collects anonymous usage telemetry to understand which commands are used, how often they fail, and how long they take. Telemetry is **opt-in** — nothing is sent until you explicitly enable it.

---

## How it works

### The decision chain

On every CLI invocation that requires infrastructure (i.e., has a `.jumbo/` directory), the following happens at startup:

1. **Settings read** — `.jumbo/settings.jsonc` is read for `telemetry.enabled` and `telemetry.anonymousId`
2. **Environment check** — CI variables and `JUMBO_TELEMETRY_DISABLED` are inspected
3. **Client selection** — If consent is active AND no environment override is detected, a `PostHogTelemetryClient` is created. Otherwise, a `NoOpTelemetryClient` is wired in (all calls are silently ignored)

This decision is made once during `HostBuilder.build()`. The selected client is injected into the application container and used for the entire command lifecycle.

### What gets tracked

Every CLI command invocation emits a single `cli_command_executed` event with these properties:

| Property | Example | Description |
|----------|---------|-------------|
| `commandName` | `"goal start"` | The command path (e.g., `session start`, `telemetry status`) |
| `cliVersion` | `"2.0.0"` | Jumbo CLI version from `package.json` |
| `nodeVersion` | `"v20.11.0"` | Node.js runtime version |
| `osPlatform` | `"win32"` | Operating system (`win32`, `darwin`, `linux`) |
| `osArch` | `"x64"` | CPU architecture (`x64`, `arm64`) |
| `success` | `true` | Whether the command completed without error |
| `durationMs` | `142` | Execution time in milliseconds |
| `errorType` | `"TypeError"` | Error class name (only present on failure) |

### Non-blocking guarantee

- `track()` is a synchronous fire-and-forget call that queues the event in memory
- Telemetry never adds latency to command execution
- Before process exit, `shutdown()` flushes queued events with a 5-second timeout
- If flush fails or times out, the process exits anyway — telemetry never blocks termination

---

## First-time setup

### New projects

`jumbo project init` includes a consent prompt:

```
Allow anonymous telemetry to help improve Jumbo? (y/N)
```

Answering yes runs `jumbo telemetry enable` under the hood.

### Legacy projects

If a project was created before telemetry existed:

1. Run `jumbo evolve --yes` — this ensures `.jumbo/settings.jsonc` exists with the telemetry section (defaults to `enabled: false`)
2. Optionally run `jumbo telemetry enable` to opt in

---

## Managing consent

```bash
# Check current status
jumbo telemetry status

# Opt in
jumbo telemetry enable

# Opt out
jumbo telemetry disable
```

### Force-disable via environment

```bash
# Disable for a single invocation
JUMBO_TELEMETRY_DISABLED=1 jumbo session start

# Disable permanently via shell profile
export JUMBO_TELEMETRY_DISABLED=1
```

### CI environments

Telemetry auto-disables when any of these environment variables are set: `CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, `JENKINS_URL`, `CIRCLECI`, `TRAVIS`, `BUILDKITE`.

No action needed — this is automatic.

---

## Debugging

### Verify telemetry is active

```bash
jumbo telemetry status
```

Look at the `Effective` field. If it shows `false`, telemetry is not sending. Check `Disabled by CI` and `Disabled by environment` to understand why.

### Inspect the settings file directly

```bash
cat .jumbo/settings.jsonc
```

The `telemetry` section shows `enabled` and `anonymousId`. If `anonymousId` is `null`, telemetry was never enabled — events have no identity to attach to and the `NoOpTelemetryClient` is used even if `enabled` is `true`.

### Verify events reach PostHog

1. Enable telemetry: `jumbo telemetry enable`
2. Run any command: `jumbo goals list`
3. Check PostHog's Live Events view — filter by the `anonymousId` from your settings file
4. You should see a `cli_command_executed` event within a few seconds

### Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Effective: false` despite `Enabled: true` | CI variable or `JUMBO_TELEMETRY_DISABLED=1` detected | Unset the blocking variable |
| `anonymousId: null` with `Enabled: true` | Settings were manually edited | Run `jumbo telemetry disable` then `jumbo telemetry enable` to regenerate the ID |
| No events in PostHog | Network blocked, API key invalid, or PostHog is down | Check network access to `eu.i.posthog.com`; errors are silently swallowed by design |
| Events appear with wrong properties | CLI version mismatch | Ensure `jumbo --version` matches what you expect |

---

## Testing during development

### Unit tests

```bash
npx jest tests/presentation/cli/AppRunner.test.ts
```

Tests mock the `ITelemetryClient` and verify:
- Successful commands track with correct properties
- `process.exit` failures track with `errorType: "ProcessExit"` and flush before exit
- Thrown errors track with the error's class name

### Integration test

```bash
npx jest tests/integration/cli-telemetry.integration.test.ts
```

Verifies end-to-end flow: real command registry resolves the command, `AppRunner` executes it, and the telemetry client receives the expected event.

### Infrastructure tests

```bash
# PostHog client (SDK isolation, error handling, shutdown)
npx jest tests/infrastructure/telemetry/PostHogTelemetryClient.test.ts

# NoOp client (silent no-ops)
npx jest tests/infrastructure/telemetry/NoOpTelemetryClient.test.ts

# Environment detection (CI, JUMBO_TELEMETRY_DISABLED)
npx jest tests/infrastructure/telemetry/ProcessTelemetryEnvironmentReader.test.ts

# Consent resolution logic
npx jest tests/application/context/telemetry/TelemetryConsentStatusResolver.test.ts
```

### Run all telemetry tests at once

```bash
npx jest --testPathPattern="telemetry"
```

---

## Architecture overview

```
Presentation                Application                 Infrastructure
─────────────              ─────────────               ────────────────
AppRunner                  ITelemetryClient ◄────────── PostHogTelemetryClient
  executeCommandWithTelemetry()                         NoOpTelemetryClient
  trackCommandTelemetry()  ITelemetryEnvironmentReader  ProcessTelemetryEnvironmentReader
  shutdownTelemetryClient()
                           TelemetryConsentStatusResolver
Host                                                    FsSettingsReader
  registerSignalHandlers()                              FsSettingsInitializer
  shutdownTelemetry()
                           HostBuilder (wires PostHog or NoOp based on consent + environment)
```

- **AppRunner** instruments commands — measures duration, captures success/failure, calls `track()`
- **Host** ensures telemetry flushes on process signals (SIGINT, SIGTERM, exit)
- **HostBuilder** makes the consent decision once at startup and injects the appropriate client
- **PostHogTelemetryClient** wraps the PostHog Node SDK with full error isolation
- **NoOpTelemetryClient** silently discards all calls when telemetry is off

### Key files

| File | Role |
|------|------|
| `src/presentation/cli/AppRunner.ts` | Command instrumentation and telemetry tracking |
| `src/infrastructure/host/Host.ts` | Signal-based telemetry shutdown |
| `src/infrastructure/host/HostBuilder.ts` | Consent-based client wiring |
| `src/infrastructure/telemetry/PostHogTelemetryClient.ts` | PostHog SDK adapter |
| `src/infrastructure/telemetry/NoOpTelemetryClient.ts` | Silent no-op implementation |
| `src/infrastructure/telemetry/PostHogTelemetryConstants.ts` | API key and host configuration |
| `src/application/telemetry/ITelemetryClient.ts` | Port interface |
| `src/application/context/telemetry/TelemetryConsentStatusResolver.ts` | Consent + environment resolution |
| `.jumbo/settings.jsonc` | Per-project consent and anonymous ID storage |
