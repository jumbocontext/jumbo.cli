---
title: Telemetry Commands Reference
description: Complete reference for telemetry consent management commands.
sidebar:
  order: 17
---

Manage anonymous usage telemetry consent and view telemetry status.

---

## jumbo telemetry status

Show the current telemetry consent state, runtime status, and anonymous ID.

### Synopsis

```bash
> jumbo telemetry status
```

### Output fields

| Field | Description |
|-------|-------------|
| Configured | Whether telemetry has been explicitly configured (enable or disable was called) |
| Enabled | The stored consent preference in settings |
| Effective | Whether telemetry is actually active at runtime (reflects CI and environment overrides) |
| Anonymous ID | The UUID used as `distinct_id` for PostHog events, or `null` if never enabled |
| Disabled by CI | Whether a CI environment variable was detected |
| Disabled by environment | Whether `JUMBO_TELEMETRY_DISABLED=1` is set |

---

## jumbo telemetry enable

Opt into anonymous usage telemetry.

### Synopsis

```bash
> jumbo telemetry enable
```

### Behavior

- Sets `telemetry.enabled` to `true` in `.jumbo/settings.jsonc`
- Generates a random anonymous UUID on first enable (persisted as `telemetry.anonymousId`)
- Subsequent enables reuse the existing anonymous ID
- Telemetry is still suppressed at runtime if a CI environment or `JUMBO_TELEMETRY_DISABLED=1` is detected

---

## jumbo telemetry disable

Opt out of anonymous usage telemetry.

### Synopsis

```bash
> jumbo telemetry disable
```

### Behavior

- Sets `telemetry.enabled` to `false` in `.jumbo/settings.jsonc`
- The anonymous ID is preserved in settings (not deleted) so re-enabling reuses the same ID
- Takes effect immediately — no telemetry events are sent after this command

---

## Environment overrides

Telemetry can be disabled at the environment level regardless of the stored consent setting.

| Mechanism | How it works |
|-----------|--------------|
| `JUMBO_TELEMETRY_DISABLED=1` | Force-disables telemetry regardless of settings |
| CI detection | Telemetry auto-disables when any of these variables are set: `CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, `JENKINS_URL`, `CIRCLECI`, `TRAVIS`, `BUILDKITE` |

When either override is active, `jumbo telemetry status` shows `Effective: false` even if `Enabled: true`.

---

## Settings file

Telemetry configuration is stored in `.jumbo/settings.jsonc`:

```jsonc
{
  "telemetry": {
    // Whether anonymous usage telemetry is enabled
    "enabled": false,
    // Anonymous identifier used after telemetry opt-in
    "anonymousId": null
  }
}
```

- New projects get `enabled: false` and `anonymousId: null` by default
- `jumbo project init` prompts for telemetry consent during first-time setup
- `jumbo evolve` ensures the settings file and telemetry section exist for legacy projects
