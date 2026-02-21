---
name: refactoring-inline-function
description: Use when a function body is as clear as its name, indirection adds no value, or you want to consolidate poorly factored functions before re-extracting.
---

# Inline Function

**Prompt:** Apply the "Inline Function" refactoring to simplify code by replacing a function call with the function's body.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Sometimes a function body is just as readable as its name. When indirection is needless — the function simply delegates to another expression or is so short it adds no clarity — the code is clearer without it. This is also useful when you have a group of poorly factored functions and want to inline them all into one big function before re-extracting along better boundaries.

## Mechanics

1. Verify the function is not polymorphic (not overridden by subclasses)
2. Find all callers of the function
3. Replace each call with the body of the function
4. Adjust variable names if the function's parameter names clash with variables in the calling context
5. Test after each replacement
6. Remove the function declaration once all callers have been inlined

## Example

### Before

```typescript
function getRating(driver: Driver): number {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1;
}

function moreThanFiveLateDeliveries(driver: Driver): boolean {
  return driver.lateDeliveryCount > 5;
}
```

### After

```typescript
function getRating(driver: Driver): number {
  return driver.lateDeliveryCount > 5 ? 2 : 1;
}
```

## When to Use

- The function body is as clear as the function name
- You have a cluster of functions with too much indirection
- You want to consolidate before re-extracting along better boundaries

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

