---
title: Advanced Workflows
description: Advanced patterns for chaining commands, running concurrent agent sessions, and keeping Jumbo workflows efficient.
sidebar:
  order: 5
---

Use these patterns when you want faster execution, reliable context handoff, and clean multi-agent collaboration.

## Chain the full goal lifecycle

Use this sequence to move a goal from definition to completion with clear checkpoints:

```bash
> jumbo goal add --objective "..." --criteria "..." --scope-in "..."
> jumbo goal refine --id <goalId> --interactive
> jumbo goal commit --id <goalId>
> jumbo goal start --id <goalId>
> jumbo goal submit --id <goalId>
> jumbo goal review --id <goalId>
> jumbo goal approve --id <goalId>
> jumbo goal codify --id <goalId>
> jumbo goal close --id <goalId>
```

Tips:

- Use `jumbo goal update-progress --id <goalId> --task-description "..."` after each meaningful sub-task.
- If QA finds issues, use `jumbo goal reject --id <goalId> --audit-findings "..."`, fix, then `submit` again.
- `jumbo goal qualify --id <goalId>` exists for backward compatibility but is deprecated in favor of `goal approve`.

## Control phase handoffs with --continue

Cross-phase transition commands (`commit`, `submit`, `approve`, `reject`, `close`) accept a `--continue` flag that changes how next-step output is framed.

- **Without `--continue`** (default): output names the upcoming phase and command as informational guidance. The agent stops at the phase boundary.
- **With `--continue`**: output is an imperative directive, telling the agent to proceed immediately.

Use the default when different agents or models handle different phases (e.g., a cheaper model refines, a stronger model implements, a dedicated reviewer approves). Use `--continue` when a single agent should drive through multiple phases without stopping.

```bash
# Multi-agent: implementer stops after submit, reviewer picks up separately
> jumbo goal submit --id <goalId>

# Single-agent: implementer continues straight into review
> jumbo goal submit --id <goalId> --continue
```

## Run multiple agents in parallel safely

Jumbo supports concurrent workers in separate terminals.

Recommended pattern:

1. Terminal A starts one goal: `jumbo goal start --id <goalA>`
2. Terminal B starts a different goal: `jumbo goal start --id <goalB>`
3. Each terminal updates progress on its own goal as work completes.
4. Pause one worker without affecting others using `jumbo work pause` and later `jumbo work resume`.

Rules for low-conflict parallel work:

- Assign non-overlapping scopes when creating goals.
- Keep goals small and vertically sliced.
- Submit frequently so review/codify can run while implementation continues elsewhere.

## Use work-level pause and resume for continuity

`work pause` and `work resume` operate on the current worker's claimed goal.

Use them when:

- You need to compress context before handing work off.
- You need to switch priorities without losing current execution state.
- You want the next session to reload the right goal context automatically.

## Keep context quality high with lightweight habits

To get the most out of Jumbo:

- Register decisions when architectural choices are made: `jumbo decision add ...`
- Register guidelines/invariants when user corrections define standards.
- Keep component and dependency records current before starting large goals.
- Use `jumbo session start` at the beginning of every agent session so orientation is consistent.

## Recommended rapid workflow

For day-to-day execution:

```bash
> jumbo session start
> jumbo goals list --status defined,refined,doing,paused
> jumbo goal start --id <goalId>
# implement in your coding agent
> jumbo goal update-progress --id <goalId> --task-description "..."
> jumbo goal submit --id <goalId>
```

Then proceed with review, approval, and codification as needed.
