---
name: refactoring-replace-query-with-parameter
description: Use when a function internally queries a global, singleton, or external object, creating a hidden dependency that hurts testability and reuse.
---

# Replace Query with Parameter

**Prompt:** Apply the "Replace Query with Parameter" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Sometimes a function reaches out to query a global variable, a singleton, or another object to get a value it needs. This internal query creates a hidden dependency that makes the function harder to test, reason about, and reuse in different contexts. By moving the query to the caller and passing the result as a parameter, you make the dependency explicit, improve testability (callers can pass any value), and give the function referential transparency.

## Mechanics

1. Extract the query logic from the function body into a variable at the call site.
2. Add a new parameter to the function for the query result.
3. Replace the internal query in the function body with a reference to the new parameter.
4. Update all callers to perform the query and pass the result.
5. Remove the query logic from the function body.
6. Test after each change.

## Example

### Before

```typescript
class Thermostat {
  private static currentTemperature = 22;

  static getCurrent(): number {
    return Thermostat.currentTemperature;
  }
}

class HeatingPlan {
  constructor(
    private min: number,
    private max: number,
  ) {}

  targetTemperature(): number {
    const current = Thermostat.getCurrent();
    if (current < this.min) return this.min;
    if (current > this.max) return this.max;
    return current;
  }
}

// Caller
const plan = new HeatingPlan(18, 26);
const target = plan.targetTemperature();
```

### After

```typescript
class Thermostat {
  private static currentTemperature = 22;

  static getCurrent(): number {
    return Thermostat.currentTemperature;
  }
}

class HeatingPlan {
  constructor(
    private min: number,
    private max: number,
  ) {}

  targetTemperature(currentTemperature: number): number {
    if (currentTemperature < this.min) return this.min;
    if (currentTemperature > this.max) return this.max;
    return currentTemperature;
  }
}

// Caller
const plan = new HeatingPlan(18, 26);
const target = plan.targetTemperature(Thermostat.getCurrent());
```

## When to Use

- A function internally queries a global, singleton, or external object, creating a hidden dependency.
- You want to make the function easier to test by allowing callers to supply any value.
- You want the function to be pure or at least free of implicit coupling to specific data sources.
- Moving the query to the caller does not place an unreasonable burden on callers.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

