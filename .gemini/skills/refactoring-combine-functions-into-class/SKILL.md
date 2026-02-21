---
name: refactoring-combine-functions-into-class
description: Use when a group of functions all operate on the same data, passing it between each other, signaling they belong together as a class.
---

# Combine Functions into Class

**Prompt:** Apply the "Combine Functions into Class" refactoring to group related functions and the data they share into a single class.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a group of functions all operate on the same data, passing it from one to the next, it is a signal that these functions and that data belong together in a class. Forming a class makes the common environment explicit, simplifies function signatures by removing the repeated data parameter, and provides a clear home for future behavior related to that data.

## Mechanics

1. Apply Encapsulate Record to the common data if it is not already an object
2. Create a class that accepts the common data in its constructor
3. Move each function into the class as a method using Move Function — remove the data parameter from each, since the class now holds it
4. Any logic left at the call site that manipulates the data can become a method of the class as well
5. Test after each move

## Example

### Before

```typescript
function baseCharge(usage: number): number {
  if (usage <= 100) return usage * 0.05;
  if (usage <= 200) return 100 * 0.05 + (usage - 100) * 0.07;
  return 100 * 0.05 + 100 * 0.07 + (usage - 200) * 0.10;
}

function taxableCharge(usage: number): number {
  return Math.max(0, baseCharge(usage) - 10);
}

function totalBill(usage: number, taxRate: number): number {
  const base = baseCharge(usage);
  const taxable = taxableCharge(usage);
  return base + taxable * taxRate;
}

// caller
const bill = totalBill(250, 0.08);
```

### After

```typescript
class UtilityBill {
  constructor(private readonly usage: number, private readonly taxRate: number) {}

  get baseCharge(): number {
    if (this.usage <= 100) return this.usage * 0.05;
    if (this.usage <= 200) return 100 * 0.05 + (this.usage - 100) * 0.07;
    return 100 * 0.05 + 100 * 0.07 + (this.usage - 200) * 0.10;
  }

  get taxableCharge(): number {
    return Math.max(0, this.baseCharge - 10);
  }

  get total(): number {
    return this.baseCharge + this.taxableCharge * this.taxRate;
  }
}

// caller
const bill = new UtilityBill(250, 0.08).total;
```

## When to Use

- Several functions take the same data parameter and operate on it together
- You frequently call one function and immediately pass its result to another in the same group
- You want a clear home for shared logic that currently lives as free-standing utility functions

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

