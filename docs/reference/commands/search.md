---
title: Search Command Reference
description: Complete reference for querying the global Jumbo memory search index.
sidebar:
  order: 2
---

Query the projected Jumbo memory search index from the terminal.

The same projected memory index is also available in the TUI. Run `jumbo`,
then press `/` to open interactive search, type a query, and use the arrow keys
to move through focused result previews.

---

## jumbo search

Search across indexed memory categories and render grouped generic hits.

### Synopsis

```bash
> jumbo search --query <text> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-q, --query <text>` | Search query text (required) |
| `-c, --category <category>` | Filter by category: `component`, `dependency`, `decision`, `guideline`, `invariant` |
| `-l, --limit <limit>` | Maximum results to return: `1` through `100` |
| `-o, --output <level>` | Output detail: `default` or `compact` |
| `--format <format>` | Global output format: `text`, `json`, `yaml`, or `ndjson` |

### Examples

```bash
# Search all indexed memory categories
> jumbo search --query "event bus"

# Search one category with compact text output
> jumbo search --query "sqlite" --category decision --output compact

# Emit a single structured JSON object for agents
> jumbo search --query "testing" --limit 10 --format json
```
