---
name: refactoring-replace-nested-conditional-with-guard-clauses
description: Use when deeply nested if-else chains obscure the normal execution path, and handling special cases early with guard clauses would flatten the logic.
---

# Replace Nested Conditional with Guard Clauses

**Prompt:** Apply the "Replace Nested Conditional with Guard Clauses" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Nested conditionals make it difficult to see the normal flow of execution. Each level of nesting forces the reader to maintain more mental context about which conditions are active. Guard clauses solve this by handling special cases early and returning immediately, leaving the main logic un-indented and clearly visible. The key insight is that not all branches of a conditional are equally important. When one branch is the normal case and the others are unusual or exceptional, guard clauses communicate this asymmetry directly through the structure of the code.

## Mechanics

1. Identify the special-case conditions that lead to an early exit or simple result.
2. For each special case, replace the nested conditional with a top-level guard clause that returns (or throws) immediately.
3. After each replacement, test to confirm behavior is preserved.
4. Once all special cases use guard clauses, the remaining code represents the normal path and should be at the top level of indentation.

## Example

### Before

```typescript
function getPaymentAmount(order: Order): number {
  let result: number;

  if (order.isCancelled) {
    result = 0;
  } else {
    if (order.isPreOrder) {
      result = order.preOrderDeposit;
    } else {
      if (order.hasDiscount) {
        result = order.basePrice * (1 - order.discountRate);
      } else {
        result = order.basePrice;
      }
    }
  }

  return result;
}
```

### After

```typescript
function getPaymentAmount(order: Order): number {
  if (order.isCancelled) return 0;
  if (order.isPreOrder) return order.preOrderDeposit;
  if (order.hasDiscount) return order.basePrice * (1 - order.discountRate);

  return order.basePrice;
}
```

## When to Use

- A function has deeply nested if-else chains that obscure the main logic.
- Some conditional branches handle special or exceptional cases with simple outcomes.
- The function has a clear "normal" path that the nesting makes hard to see.
- You want to reduce indentation and improve the linear readability of a function.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

