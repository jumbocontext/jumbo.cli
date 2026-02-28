---
title: Session Management
description: Manage work sessions for effective context delivery across work periods.
sidebar:
  order: 3
---

# Session Management

Manage work sessions for effective context delivery.

---

## Overview

Sessions provide continuity between work periods. Starting a session:

- Loads project orientation context
- Shows recent accomplishments
- Displays available goals
- Prepares your AI agent for work

---

## Session lifecycle

```
                  ┌────────┐
            ┌────▶│ active │◀────┐
            │     └────────┘     │
            │        │  │        │
            │    end │  │ work   │ work
            │        │  │ pause  │ resume
            │        ▼  ▼        │
            │     ┌────────┐     │
  start     │     │ paused │─────┘
            │     └────────┘
            │        │
            │        │ end
            │        ▼
            │     ┌───────┐
            └─────│ ended │
                  └───────┘
```

A session begins in `active` status. When the current goal is paused via `work pause`, the session transitions to `paused`. Resuming work with `work resume` returns the session to `active`. A session can be ended from either `active` or `paused` status.

---

## Start a session

```bash
> jumbo session start
```

Jumbo displays:

| Context | Description |
|---------|-------------|
| **Project context** | Name, purpose, audiences, and pain points |
| **Previous session** | Summary of what was accomplished last time |
| **In-progress goals** | Goals currently in `doing` status |
| **Planned goals** | Goals in `defined` status ready to start |

Your AI agent is prompted to ask which goal you want to work on.

---

## End a session

Summarize what was accomplished:

```bash
> jumbo session end --focus "Completed authentication implementation"
```

Add a detailed summary:

```bash
> jumbo session end --focus "Bug fixes" --summary "Fixed 3 critical bugs in payment processing"
```

| Option | Description |
|--------|-------------|
| `--focus <text>` | Brief summary of main accomplishment (required) |
| `--summary <text>` | Detailed session summary (optional) |

The focus and summary become orientation context for your next session.

---

## Pause and resume work

When you need to switch context or take a break mid-goal, pause your current work instead of ending the session:

```bash
# Pause the current worker's active goal
> jumbo work pause
```

This pauses the active goal for the current worker and transitions the session to `paused` status. The goal's progress is preserved.

To resume where you left off:

```bash
# Resume the current worker's paused goal
> jumbo work resume
```

This resumes the paused goal, reloads goal context for the agent, and returns the session to `active` status.

---

## Compact session context

When a conversation grows long and the agent approaches context limits, trigger compaction:

```bash
> jumbo session compact
```

This signals the agent to compact its context window, preserving essential project and goal context while reducing token usage.

---

## List sessions

View session history with optional status filtering:

```bash
# List all sessions
> jumbo sessions list

# List only active sessions
> jumbo sessions list --status active

# List paused sessions
> jumbo sessions list --status paused
```

| Status | Description |
|--------|-------------|
| `active` | Currently running sessions |
| `paused` | Sessions with paused work |
| `ended` | Completed sessions |
| `all` | All sessions (default) |

---

## Typical workflow

### Daily workflow

```bash
# Morning: Start your session
jumbo session start

# Pick a goal to work on
jumbo goal start --id <id>

# Work with your AI agent...

# Complete the goal when done
jumbo goal complete --id <id>

# End of day: End the session
jumbo session end --focus "Completed user authentication module"
```

### Multi-goal session

```bash
# Start session
jumbo session start

# Work on first goal
jumbo goal start --id goal_123
# ... complete work ...
jumbo goal complete --id goal_123

# Start another goal in the same session
jumbo goal start --id goal_456
# ... complete work ...
jumbo goal complete --id goal_456

# End session with summary of all work
jumbo session end --focus "Completed auth and added user profiles"
```

### Pause and resume workflow

```bash
# Start session and begin work
jumbo session start
jumbo goal start --id goal_123

# Need to switch context — pause current work
jumbo work pause

# Later: resume where you left off
jumbo work resume

# Continue working, then end session
jumbo session end --focus "Partial progress on goal_123"
```

### Returning to in-progress work

```bash
# Start new session
jumbo session start

# Resume an in-progress goal (already in 'doing' status)
jumbo goal resume --id goal_789
```

---

## Best practices

1. **Start every work period with `session start`**
   Ensures your AI agent has current project context

2. **End sessions with meaningful summaries**
   The focus becomes orientation context for next time

3. **Complete goals before ending sessions**
   Triggers knowledge capture prompts

4. **Use `work pause` instead of ending sessions mid-goal**
   Preserves goal progress and session continuity

5. **Compact when conversations grow long**
   Use `session compact` to stay within context limits without losing essential context

---

## Next steps

- [Goal management guide](goal-management.md) — Master the goal lifecycle
- [Session command reference](../reference/commands/session.md) — Complete command details
