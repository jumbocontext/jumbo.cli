---
name: release-jumbo
description: This skill guides the agent through the pre-release workflow.
---

# Release Jumbo
## Instructions
1. **Update CHANGELOG.md**: Move `[Unreleased]` items under a new version header with date
2. **Check git for any changes missing from CHANGELOG.md**: Use git diff to determine what has been changed since the last release, compare with the documented changes, and fill any gaps.
3. **Bump version**: Update `version` in `package.json`. Use semantic versioning 2.0.
4. **Commit**: `git commit -am "chore: release {version}"`
5. **Tag**: `git tag {version}`
6. **Push**: `git push && git push --tags`
7. **GitHub Release**: Create release from the tag, paste changelog section as notes
8. **Publish**: `npm publish`

