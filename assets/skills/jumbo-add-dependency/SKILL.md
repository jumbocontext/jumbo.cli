---
name: jumbo-add-dependency
description: Use liberally when you introduce, discover, or upgrade a third-party package or external service. Registers the dependency so future sessions know what the project relies on.
---

# Add Dependency

Register a third-party dependency with Jumbo when you add a new package, discover an unregistered one, or integrate with an external service.

## Command Syntax

```bash
jumbo dependency add \
  --name "<Display name>" \
  --ecosystem "<npm|pip|maven|service|...>" \
  --package-name "<package-identifier>" \
  --version-constraint "<semver-range>"
```

## Bad Example

```bash
jumbo dependency add \
  --name "testing lib" \
  --ecosystem npm \
  --package-name jest
```

Name does not match the package. Missing version constraint means future agents cannot detect version drift or compatibility issues.

## Good Example

```bash
jumbo dependency add \
  --name "Jest" \
  --ecosystem npm \
  --package-name jest \
  --version-constraint "^29.7.0"
```

Name matches the package identity. Ecosystem and package name enable automated lookups. Version constraint communicates the compatibility range.
