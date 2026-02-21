---
name: refactoring-separate-query-from-modifier
description: Use when a function both returns a value and produces a side effect, and you need to split it into a pure query and a separate modifier.
---

# Separate Query from Modifier

**Prompt:** Apply the "Separate Query from Modifier" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a function both returns a value and produces a side effect, callers face a dilemma: they may need the return value but not the side effect, or vice versa. Mixing queries and commands in a single function makes the code harder to reason about, test, and reuse. By splitting the function into a pure query (no side effects) and a separate modifier (performs the side effect), you gain the freedom to call the query as many times as needed without worrying about unintended changes, and you make the modifier's intent explicit.

## Mechanics

1. Create a new query function that returns the same value as the original but has no side effects.
2. Modify the original function to call the new query function for its return value.
3. Replace each call to the original function with a call to the query function, followed by a call to the modifier if the side effect is needed.
4. Remove the return value from the modifier function so it returns `void`.
5. Test after each change.

## Example

### Before

```typescript
class AlertSystem {
  private alerts: string[] = [];

  findAndFlagIntruder(people: string[]): string {
    for (const person of people) {
      if (person === "Don") {
        this.alerts.push("Intruder detected: Don");
        return "Don";
      }
      if (person === "John") {
        this.alerts.push("Intruder detected: John");
        return "John";
      }
    }
    return "";
  }
}

// Caller
const system = new AlertSystem();
const intruder = system.findAndFlagIntruder(["Alice", "Don", "Bob"]);
if (intruder !== "") {
  console.log(`Found: ${intruder}`);
}
```

### After

```typescript
class AlertSystem {
  private alerts: string[] = [];

  findIntruder(people: string[]): string {
    for (const person of people) {
      if (person === "Don") return "Don";
      if (person === "John") return "John";
    }
    return "";
  }

  flagIntruder(people: string[]): void {
    const intruder = this.findIntruder(people);
    if (intruder !== "") {
      this.alerts.push(`Intruder detected: ${intruder}`);
    }
  }
}

// Caller
const system = new AlertSystem();
const intruder = system.findIntruder(["Alice", "Don", "Bob"]);
system.flagIntruder(["Alice", "Don", "Bob"]);
if (intruder !== "") {
  console.log(`Found: ${intruder}`);
}
```

## When to Use

- A function returns a value and also changes observable state.
- You want to call the query freely without triggering side effects.
- You need to test the query logic independently from the mutation logic.
- You are following the Command-Query Separation principle.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

