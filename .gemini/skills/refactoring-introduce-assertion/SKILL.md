---
name: refactoring-introduce-assertion
description: Use when code depends on implicit assumptions about inputs or state that should be made explicit and self-documenting through executable assertions.
---

# Introduce Assertion

**Prompt:** Apply the "Introduce Assertion" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Code often works correctly only under certain assumptions -- a value must be positive, an array must be non-empty, a parameter must not be null. When these assumptions are implicit, bugs become harder to diagnose because the failure occurs far from the violated assumption. Assertions make these assumptions explicit and self-documenting. They serve as executable documentation: they tell future readers what must be true at a given point, and they fail loudly during development when an assumption is violated. Assertions should only be used for conditions that are genuinely expected to always hold (programmer errors), not for validating external input or handling anticipated runtime failures.

## Mechanics

1. Identify a section of code that only works correctly if a certain condition is true.
2. Add an assertion that checks for that condition, placed at the earliest point where the assumption applies.
3. Ensure the assertion is a declaration of something that should always be true, not a check for a condition that could legitimately fail at runtime.
4. Do not change the behavior of the program: assertions should never have side effects.
5. Test to confirm the assertion holds for all existing use cases.

## Example

### Before

```typescript
function applyDiscount(originalPrice: number, discountRate: number): number {
  // discountRate should be between 0 and 1, but nothing enforces this
  const discountedPrice = originalPrice - originalPrice * discountRate;
  return Math.max(discountedPrice, 0);
}

function calculatePerItemCost(totalCost: number, itemCount: number): number {
  // itemCount is assumed to be positive
  return totalCost / itemCount;
}
```

### After

```typescript
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function applyDiscount(originalPrice: number, discountRate: number): number {
  assert(originalPrice >= 0, "originalPrice must be non-negative");
  assert(
    discountRate >= 0 && discountRate <= 1,
    "discountRate must be between 0 and 1",
  );

  const discountedPrice = originalPrice - originalPrice * discountRate;
  return Math.max(discountedPrice, 0);
}

function calculatePerItemCost(totalCost: number, itemCount: number): number {
  assert(itemCount > 0, "itemCount must be positive");

  return totalCost / itemCount;
}
```

## When to Use

- A section of code only works correctly under certain assumptions about its inputs or state.
- The assumptions are not obvious from the code itself and would benefit from being made explicit.
- The condition represents a programmer error (invariant violation), not an expected runtime scenario.
- You want to catch violated assumptions early during development rather than debugging downstream symptoms.
- You do NOT want to use assertions for validating user input or handling anticipated error conditions -- use proper validation and error handling for those.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

