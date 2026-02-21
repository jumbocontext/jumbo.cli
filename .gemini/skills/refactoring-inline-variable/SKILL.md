---
name: refactoring-inline-variable
description: Use when a variable name adds no meaning beyond the expression itself, or the variable is blocking another refactoring.
---

# Inline Variable

**Prompt:** Apply the "Inline Variable" refactoring to remove a redundant variable by replacing it with the expression itself.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Sometimes a variable name communicates no more than the expression it holds. In these cases the variable gets in the way of other refactorings. Inlining it removes unnecessary indirection and keeps the code compact.

## Mechanics

1. Check that the right-hand side of the assignment has no side effects
2. If the variable is not already declared immutable, make it so and test — this verifies it is only assigned once
3. Find all references to the variable and replace them with the right-hand side expression
4. Test after each replacement
5. Remove the variable declaration and assignment

## Example

### Before

```typescript
function isEligibleForDiscount(order: Order): boolean {
  const basePrice = order.quantity * order.unitCost;
  return basePrice > 1000;
}
```

### After

```typescript
function isEligibleForDiscount(order: Order): boolean {
  return order.quantity * order.unitCost > 1000;
}
```

## When to Use

- The variable name adds no additional meaning over the expression
- The variable is preventing another refactoring
- The expression is short and clear on its own

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

