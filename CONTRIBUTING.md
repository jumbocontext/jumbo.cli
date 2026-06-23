# Contributing to Jumbo

Thanks for your interest in contributing to Jumbo!

## How to Contribute

### Reporting Issues

Issues are welcome! Before opening an issue:

1. Search existing issues to avoid duplicates
2. Use a clear, descriptive title
3. Include steps to reproduce (for bugs)
4. Describe expected vs actual behavior

### Pull Requests

Pull requests are welcome. Before submitting:

1. Open an issue first to discuss the change
2. Keep PRs focused - one feature or fix per PR
3. Follow existing code style and patterns
4. Include tests for new functionality
5. Add a changeset if your change affects users (see below)

### Changesets

We use [changesets](https://github.com/changesets/changesets) to track what changed and generate release notes. If your PR changes user-facing behavior, add a changeset file in `.changeset/`:

```md
---
"jumbo-cli": patch
---

Short description of the change.
```

Use `patch` for fixes, `minor` for new features, `major` for breaking changes. Internal refactors, docs-only changes, and CI tweaks don't need a changeset.

### Contributor License Agreement

By submitting a pull request, you agree to the following CLA terms:

> I grant the project maintainer a perpetual, worldwide, non-exclusive, royalty-free, irrevocable license to use, reproduce, modify, distribute, and sublicense my contributions, including for commercial purposes, while the open source project remains available under the AGPL-3.0 license.

**Why a CLA?** Jumbo is dual-licensed to remain sustainable. Your contributions stay open source under AGPL-3.0, while also enabling future commercial offerings. This keeps the project alive and actively maintained.

## Development

```bash
npm install
npm test
npm run build
```

## Questions?

Open an issue or start a discussion. We're happy to help.
