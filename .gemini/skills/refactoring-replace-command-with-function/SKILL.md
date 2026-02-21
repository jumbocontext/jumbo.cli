---
name: refactoring-replace-command-with-function
description: Use when a command class has only a single execute method with no undo, queuing, or lifecycle behavior, making the extra class structure pure overhead.
---

# Replace Command with Function

**Prompt:** Apply the "Replace Command with Function" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Command objects are powerful, but that power comes with complexity. When a command class does nothing more than wrap a single method with no need for undo, queuing, lifecycle hooks, or inheritance, the extra class structure is pure overhead. A simple function is easier to read, easier to call, and requires less code. By replacing the command with a plain function, you reduce indirection and keep the codebase lean.

## Mechanics

1. Create a new function with the same parameters and return type as the command's `execute` method (combining constructor parameters and `execute` parameters).
2. Move the logic from `execute` into the new function body, replacing references to instance fields with the corresponding parameters.
3. Replace each call site that creates the command and calls `execute` with a direct call to the new function.
4. Remove the command class once all callers have been migrated.
5. Test after each change.

## Example

### Before

```typescript
class TaxCalculator {
  private income: number;
  private deductions: number;
  private rate: number;

  constructor(income: number, deductions: number, rate: number) {
    this.income = income;
    this.deductions = deductions;
    this.rate = rate;
  }

  execute(): number {
    const taxableIncome = Math.max(0, this.income - this.deductions);
    return taxableIncome * this.rate;
  }
}

// Caller
const calculator = new TaxCalculator(85000, 12500, 0.25);
const tax = calculator.execute();
```

### After

```typescript
function calculateTax(income: number, deductions: number, rate: number): number {
  const taxableIncome = Math.max(0, income - deductions);
  return taxableIncome * rate;
}

// Caller
const tax = calculateTax(85000, 12500, 0.25);
```

## When to Use

- The command class has only a single method (`execute`) and no additional behavior (no undo, no queuing, no lifecycle hooks).
- The command does not benefit from inheritance or polymorphism.
- The class adds boilerplate without providing any structural advantage.
- You want to simplify the code and reduce the number of abstractions.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

