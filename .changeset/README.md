# Changesets

This folder is managed by [@changesets/cli](https://github.com/changesets/changesets).

Each PR that changes user-facing behavior should include a changeset file. Create one by adding a markdown file here with the following format:

```md
---
"jumbo-cli": patch
---

Description of the change.
```

Use `patch` for fixes, `minor` for new features, `major` for breaking changes.
