---
name: refactoring-decompose-conditional
description: Use when complex conditional logic is hard to reason about and extracting the condition and branches into named functions would reveal intent.
---

# Decompose Conditional

**Prompt:** Apply the "Decompose Conditional" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Complex conditional logic is one of the hardest things to reason about in code. As the conditions grow longer and the bodies of each branch accumulate more logic, the reader must mentally simulate the entire block to understand what the code actually does. Decomposing the conditional into clearly named functions replaces that cognitive burden with intention-revealing names. The condition itself gets a name that explains *why* the branch is taken, and each leg gets a name that explains *what* happens. This transforms the conditional from a puzzle into a readable narrative.

## Mechanics

1. Extract the condition into its own function with a descriptive name that explains the intent of the check.
2. Extract the then-body into its own function with a name describing what it does.
3. If there is an else-body, extract it into its own function as well.
4. Test after each extraction to ensure behavior is preserved.

## Example

### Before

```typescript
function calculateCharge(date: Date, quantity: number, baseRate: number): number {
  let charge: number;

  if (date.getMonth() >= 5 && date.getMonth() <= 8) {
    charge = quantity * baseRate * 1.15 + quantity * 0.07;
  } else {
    charge = quantity * baseRate + quantity * 0.05;
  }

  return charge;
}
```

### After

```typescript
function calculateCharge(date: Date, quantity: number, baseRate: number): number {
  if (isSummerSeason(date)) {
    return summerCharge(quantity, baseRate);
  } else {
    return regularCharge(quantity, baseRate);
  }
}

function isSummerSeason(date: Date): boolean {
  return date.getMonth() >= 5 && date.getMonth() <= 8;
}

function summerCharge(quantity: number, baseRate: number): number {
  return quantity * baseRate * 1.15 + quantity * 0.07;
}

function regularCharge(quantity: number, baseRate: number): number {
  return quantity * baseRate + quantity * 0.05;
}
```

## When to Use

- The condition in an if-then-else is complex or non-obvious.
- The bodies of the then and else branches contain non-trivial logic.
- You find yourself needing a comment to explain what a conditional block does.
- Multiple developers are confused by the same conditional block.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

