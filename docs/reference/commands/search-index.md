---
title: Index Command Reference
description: Complete reference for rebuilding the projected Jumbo search index.
sidebar:
  order: 22
---

Repair derived search index state without rebuilding every Jumbo projection.

---

## jumbo index rebuild

Clears only the projected global search index and replays persisted memory events into it.

### Synopsis

```bash
> jumbo index rebuild
```

### Options

| Option | Description |
|--------|-------------|
| `--format <format>` | Global output format: `text`, `json`, `yaml`, or `ndjson` |

### Examples

```bash
# Rebuild the local project's search index
> jumbo index rebuild

# Emit structured rebuild statistics
> jumbo index rebuild --format json
```
