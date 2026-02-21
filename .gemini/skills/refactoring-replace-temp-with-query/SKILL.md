---
name: refactoring-replace-temp-with-query
description: Use when a temporary variable makes a function harder to extract, and the expression it holds can become a reusable query method.
---

# Replace Temp with Query

**Prompt:** Apply the "Replace Temp with Query" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Temporary variables capture the result of an expression so it can be reused later in the same function. While convenient, they make functions longer and harder to extract, because every extracted piece needs the temp passed in as a parameter. Replacing the temp with a query (a small function that computes the value) makes the logic reusable, gives the computation a name, and simplifies further refactoring.

## Mechanics

1. Verify the temporary variable is assigned only once (if not, split the variable first).
2. Extract the right-hand side of the assignment into a new function.
3. Replace all references to the temp with calls to the new function.
4. Remove the temp declaration and assignment.
5. Test after each step.

## Example

### Before

```typescript
class Invoice {
  constructor(
    private readonly _quantity: number,
    private readonly _unitPrice: number,
    private readonly _taxRate: number
  ) {}

  calculateTotal(): number {
    const basePrice = this._quantity * this._unitPrice;
    const discount = Math.max(0, this._quantity - 100) * this._unitPrice * 0.05;
    const tax = (basePrice - discount) * this._taxRate;
    return basePrice - discount + tax;
  }
}
```

### After

```typescript
class Invoice {
  constructor(
    private readonly _quantity: number,
    private readonly _unitPrice: number,
    private readonly _taxRate: number
  ) {}

  private get basePrice(): number {
    return this._quantity * this._unitPrice;
  }

  private get discount(): number {
    return Math.max(0, this._quantity - 100) * this._unitPrice * 0.05;
  }

  private get tax(): number {
    return (this.basePrice - this.discount) * this._taxRate;
  }

  calculateTotal(): number {
    return this.basePrice - this.discount + this.tax;
  }
}
```

## When to Use

- A temporary variable is assigned once and used in several places within the same function.
- You want to extract part of a long function but the temp creates a dependency that makes extraction awkward.
- The expression behind the temp is meaningful enough to deserve its own name.
- The computation is not expensive, or caching is acceptable (if it is expensive, consider lazy initialization instead).

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

