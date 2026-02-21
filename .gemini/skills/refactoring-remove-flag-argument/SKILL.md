---
name: refactoring-remove-flag-argument
description: Use when a function accepts a boolean or string flag that selects between distinct code paths, obscuring intent at every call site.
---

# Remove Flag Argument

**Prompt:** Apply the "Remove Flag Argument" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

A flag argument is a parameter that tells a function which logic to execute. Flag arguments obscure the intent of each call because the reader must inspect the function body to understand what `true` or `false` (or a string literal) actually means. They also make it harder to discover available behaviors from the API surface. By replacing a single flag-driven function with separate, clearly named functions, you make each code path explicit and improve readability at every call site.

## Mechanics

1. Create a separate function for each value of the flag argument, naming each to clearly express its behavior.
2. For each new function, copy the relevant logic path from the original function (or have the new function call the original with the flag value as an intermediate step).
3. Replace each call site that passes a specific flag value with a call to the corresponding new function.
4. Once all callers have been migrated, remove the original flag-driven function (or make it private if the separate functions delegate to it).
5. Test after each change.

## Example

### Before

```typescript
function deliveryDate(order: Order, isRush: boolean): Date {
  if (isRush) {
    const deliveryTime = 1;
    if (order.region === "international") {
      return addDays(order.placedOn, deliveryTime + 3);
    }
    return addDays(order.placedOn, deliveryTime + 1);
  } else {
    const deliveryTime = 3;
    if (order.region === "international") {
      return addDays(order.placedOn, deliveryTime + 5);
    }
    return addDays(order.placedOn, deliveryTime + 2);
  }
}

// Callers
const d1 = deliveryDate(myOrder, true);
const d2 = deliveryDate(myOrder, false);
```

### After

```typescript
function rushDeliveryDate(order: Order): Date {
  const deliveryTime = 1;
  if (order.region === "international") {
    return addDays(order.placedOn, deliveryTime + 3);
  }
  return addDays(order.placedOn, deliveryTime + 1);
}

function standardDeliveryDate(order: Order): Date {
  const deliveryTime = 3;
  if (order.region === "international") {
    return addDays(order.placedOn, deliveryTime + 5);
  }
  return addDays(order.placedOn, deliveryTime + 2);
}

// Callers
const d1 = rushDeliveryDate(myOrder);
const d2 = standardDeliveryDate(myOrder);
```

## When to Use

- A function accepts a boolean or string flag that selects between distinct code paths.
- Call sites pass literal `true`/`false` or string values that are meaningless without reading the function body.
- The separate behaviors are independently useful and deserve their own names.
- You want callers to clearly express which behavior they intend.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

