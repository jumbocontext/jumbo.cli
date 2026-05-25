---
title: Session Commands Reference
description: Complete reference for all session-related commands — start, end, list, and compact.
sidebar:
  order: 2
---

Complete reference for all session-related commands.

---

## jumbo session start

Start a new working session.

### Synopsis

```bash
> jumbo session start
```

### Options

None.

### Behavior

1. Records a session start event
2. Returns a workflow router packet
3. Tells the agent which workflow-specific command should load the next context packet
4. Preserves brownfield onboarding guidance when the project has no registered solution context

### Output

Displays:
- Session ID and status
- A prompt asking whether the user wants to design/define, refine, execute, review, codify, or do something different
- Route commands for each workflow
- `jumbo project show --northstar --format json` for design or definition workflows
- `jumbo goals list --format json` fallbacks for goal-id workflows

`session start` no longer includes project context, goal backlog summaries, or recent decisions. Those are loaded by the selected workflow command.

### Examples

```bash
> jumbo session start
```

---

## jumbo session end

End the current active session.

### Synopsis

```bash
> jumbo session end --focus <text> [--summary <text>]
```

### Options

| Option | Description |
|--------|-------------|
| `--focus <text>` | Summary of what was accomplished (required) |
| `--summary <text>` | Detailed session summary (optional) |

### Behavior

1. Validates an active session exists
2. Records focus and summary
3. Transitions session to `ended` status

The focus becomes orientation context for the next session.

### Examples

End session with focus summary:

```bash
> jumbo session end --focus "Completed authentication implementation"
```

End session with detailed summary:

```bash
> jumbo session end --focus "Bug fixes" --summary "Fixed 3 critical bugs in payment processing"
```

---

## jumbo sessions list

List session history.

### Synopsis

```bash
> jumbo sessions list [--status <status>]
```

### Options

| Option | Description |
|--------|-------------|
| `-s, --status <status>` | Filter by status: `active`, `paused`, `ended`, or `all` (default: `all`) |

### Behavior

Queries the session store and displays matching sessions. Without a status filter, all sessions are returned.

### Examples

List all sessions:

```bash
> jumbo sessions list
```

List only active sessions:

```bash
> jumbo sessions list --status active
```

List ended sessions:

```bash
> jumbo sessions list --status ended
```

---

## jumbo session compact

Trigger context compaction for the current session.

### Synopsis

```bash
> jumbo session compact
```

### Options

None.

### Behavior

Signals the LLM agent to compact its context window. Use this when the conversation has grown long and the agent is approaching context limits. Compaction preserves essential project and goal context while reducing token usage.

### Examples

```bash
> jumbo session compact
```
