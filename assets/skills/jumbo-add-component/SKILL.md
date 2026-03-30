---
name: jumbo-add-component
description: Use liberally when you create, discover, or modify a software component. Registers the component with Jumbo so future sessions have accurate architectural context.
---

# Add Component

Register a software component with Jumbo when you create one, discover an unregistered one, or significantly change one's responsibility.

## Command Syntax

```bash
jumbo component add \
  --name "<ComponentName>" \
  --type "<service|db|queue|ui|lib|api|worker|cache|storage>" \
  --description "<What the component does>" \
  --responsibility "<Single responsibility>" \
  --path "<file-path>"
```

## Bad Example

```bash
jumbo component add \
  --name "Utils" \
  --type "lib" \
  --description "Helper functions" \
  --responsibility "Various utilities" \
  --path "src/utils.ts"
```

Vague name, description, and responsibility. A future agent cannot determine what this component does or whether to use it.

## Good Example

```bash
jumbo component add \
  --name "EventStreamProjectionBuilder" \
  --type "service" \
  --description "Rebuilds materialized projections from event streams by replaying events through registered projection handlers" \
  --responsibility "Projection rebuilding from event history" \
  --path "src/infrastructure/projections/EventStreamProjectionBuilder.ts"
```

Name is self-documenting. Description and responsibility tell a future agent exactly what the component does and when to interact with it.
