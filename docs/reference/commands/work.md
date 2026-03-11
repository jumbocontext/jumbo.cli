---
title: Work Commands Reference
description: Complete reference for work pause and resume commands.
sidebar:
  order: 6
---

Complete reference for work lifecycle commands that operate on the current worker's goal.

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
