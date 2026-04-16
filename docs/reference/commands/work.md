---
title: Work Commands Reference
description: Complete reference for work refine, work pause, and work resume commands.
sidebar:
  order: 14
---

Complete reference for work lifecycle commands that operate on workers and goals.

---

## jumbo work refine

Long-running daemon that continuously polls for goals in `defined` state and delegates their refinement to an agent subprocess.

### Synopsis

```bash
> jumbo work refine --agent <agentId> [--poll-interval <seconds>] [--max-retries <number>]
```

### Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--agent <agentId>` | Yes | — | Agent to delegate refinement to. Supported: `claude`, `gemini`, `copilot`, `codex`, `cursor`, `vibe` |
| `--poll-interval <seconds>` | No | `30` | Seconds to wait between polling for new goals |
| `--max-retries <number>` | No | `3` | Max retry attempts per goal before skipping |

### Behavior

1. Polls `jumbo goals list --status defined` on the configured interval
2. Picks the oldest defined goal
3. Spawns the configured agent as a subprocess with a refinement prompt
4. After the subprocess exits, checks whether the goal reached `refined` status
5. If not refined, retries up to the configured max retries
6. If exhausted, skips the goal and moves to the next one
7. Repeats until stopped

The daemon holds no database connections or application infrastructure between iterations. Every interaction with Jumbo state is a short-lived subprocess.

### Graceful shutdown

Press **Q** or **Ctrl+C** to stop the daemon. The current subprocess will finish before exit.

### Examples

```bash
# Start the refinery using Claude
> jumbo work refine --agent claude

# Poll every 60 seconds with 5 retries per goal
> jumbo work refine --agent claude --poll-interval 60 --max-retries 5
```

---

## jumbo work pause

Pause the current worker's active goal.

### Synopsis

```bash
> jumbo work pause
```

### Options

None.

### Behavior

1. Identifies the current worker's active goal via claim ownership
2. Transitions the goal to `paused` status with a `WorkPaused` reason
3. The session transitions to `paused` status

The goal's progress is preserved and can be resumed later with `work resume`.

### Examples

```bash
> jumbo work pause
```

---

## jumbo work resume

Resume the current worker's paused goal.

### Synopsis

```bash
> jumbo work resume
```

### Options

None.

### Behavior

1. Identifies the current worker's paused goal
2. Transitions the goal back to `doing` status
3. Reloads enriched session context with goal-specific orientation
4. The session returns to `active` status

### Examples

```bash
> jumbo work resume
```
