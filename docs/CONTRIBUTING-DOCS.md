---
title: Documentation Contributing Guide
description: Standards and conventions for contributing to Jumbo documentation.
sidebar:
  order: 10
---

Standards and conventions for contributing to Jumbo documentation.

---

## Frontmatter schema

Every `.md` file under `docs/` **must** include YAML frontmatter with the following fields:

```yaml
---
title: Page Title                # Required — string
description: Brief summary.      # Required — string
sidebar:
  order: 1                       # Required — integer for ordering within its section
  label: Sidebar Text            # Optional — when sidebar text should differ from title
  badge:                         # Optional — Starlight sidebar badge
    text: New
    variant: tip
---
```

### Field rules

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `title` | Yes | string | Page title displayed in the browser tab and heading |
| `description` | Yes | string | Brief summary used for SEO and link previews |
| `sidebar.order` | Yes | integer | Controls position within its section |
| `sidebar.label` | No | string | Override sidebar text when it should differ from `title` |
| `sidebar.badge` | No | object | Starlight badge shown next to the sidebar link |

---

## Sidebar ordering conventions

Each section has a reserved `sidebar.order` range. **Leave gaps** between values to allow future insertions without renumbering.

| Section | Order range | Current assignments |
|---------|-------------|---------------------|
| `docs/getting-started/` | 1 -- 10 | 1: Installation, 2: First Run, 3: Concepts, 4: What Jumbo Creates |
| `docs/guides/` | 1 -- 10 | 1: Project Initialization, 2: Goal Management, 3: Session Management, 4: Dependency Migration, 5: Advanced Workflows, 6: Telemetry |
| `docs/reference/commands/` | 1 -- 20 | 1: Goal, 2: Session, 3: Project, 4: Architecture, 5: Components, 6: Decisions, 7: Dependencies, 8: Guidelines, 9: Invariants, 10: Audiences, 11: Audience Pains, 12: Value Propositions, 13: Relations, 14: Work, 15: Maintenance, 16: Worker, 17: Telemetry |

### Why gaps?

If you need to insert a page between Installation (1) and First Run (2), you can't without renumbering. The reference section uses wider gaps (1, 3, 5) so you can slot new command pages in between (e.g., order 2 for a new command group).

---

## Adding a new page

1. Create the `.md` file in the appropriate directory
2. Add frontmatter with all required fields (see schema above)
3. Choose a `sidebar.order` value that fits within the section's range, using existing gaps
4. If no gap exists, renumber the section to restore gaps (increment by 2s or 3s)
5. Update the section's `index.md` to include a link to the new page

---

## Section index files

Each subdirectory under `docs/` must have an `index.md` that:

- Has frontmatter defining the section title and description
- Lists all pages in the section with brief descriptions
- Acts as the section landing page for Starlight navigation

---

## Content conventions

- **Preserve existing content** — frontmatter is prepended, content is not modified
- **UTF-8 without BOM** — all files must use UTF-8 encoding without Byte Order Mark
- **GitHub compatibility** — content must render correctly on GitHub AND Starlight
- **Use ATX headings** (`#`, `##`, `###`) — not underline-style headings
