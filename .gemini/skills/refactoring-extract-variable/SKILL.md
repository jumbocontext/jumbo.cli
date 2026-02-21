---
name: refactoring-extract-variable
description: Use when a complex expression is hard to read and naming a sub-expression would clarify intent, or the same sub-expression appears multiple times.
---

# Extract Variable

**Prompt:** Apply the "Extract Variable" refactoring to break down a complex expression into named intermediate values.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Expressions can become very complex and hard to read. Local variables help break down the expression and give names to the pieces, making the logic easier to follow and debug. By naming a sub-expression, you give the reader a clear signal of what that part of the code represents.

## Mechanics

1. Ensure the expression you want to extract has no side effects
2. Declare a new immutable variable and set it to the result of the expression or sub-expression
3. Replace the original expression with the new variable
4. Test to confirm behavior is unchanged

## Example

### Before

```typescript
function calculatePrice(order: Order): number {
  return (
    order.quantity * order.itemPrice -
    Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
    Math.min(order.quantity * order.itemPrice * 0.1, 100)
  );
}
```

### After

```typescript
function calculatePrice(order: Order): number {
  const basePrice = order.quantity * order.itemPrice;
  const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
  const shippingSurcharge = Math.min(basePrice * 0.1, 100);
  return basePrice - quantityDiscount + shippingSurcharge;
}
```

## When to Use

- A complex expression is hard to understand at a glance
- The same sub-expression appears multiple times within a function
- You want to attach a meaningful name to a piece of arithmetic or logic
- You need to inspect intermediate values while debugging

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

