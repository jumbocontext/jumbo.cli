---
name: refactoring-replace-inline-code-with-function-call
description: Use when inline code duplicates what an existing function or standard library method already does, creating redundant logic that should be a single call.
---

# Replace Inline Code with Function Call

**Prompt:** Apply the "Replace Inline Code with Function Call" refactoring to replace hand-written logic with a call to an existing function that does the same thing.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When inline code duplicates what an existing function already does, you have two representations of the same logic. If the behavior ever needs to change, you have to find and update every inline copy. Replacing the inline code with a call to the existing function eliminates this duplication, makes the intent of the code clearer through the function's name, and ensures consistent behavior. This is especially valuable with well-tested library or utility functions where the replacement is both safer and more readable.

## Mechanics

1. Identify inline code that does the same thing as an existing function.
2. Replace the inline code with a call to the existing function.
3. Test.

This is one of the simplest refactorings. The key judgment is whether the existing function truly does the same thing as the inline code and whether the function name accurately communicates the intent.

## Example

### Before

```typescript
interface ShippingRule {
  minWeight: number;
  maxWeight: number;
  region: string;
  rate: number;
}

function hasValidShippingOption(
  rules: ShippingRule[],
  region: string,
  weight: number
): boolean {
  let found = false;
  for (const rule of rules) {
    if (
      rule.region === region &&
      weight >= rule.minWeight &&
      weight <= rule.maxWeight
    ) {
      found = true;
      break;
    }
  }
  return found;
}

function calculateShipping(
  rules: ShippingRule[],
  region: string,
  weight: number
): number | null {
  // Inline code duplicates the check in hasValidShippingOption
  let canShip = false;
  for (const rule of rules) {
    if (
      rule.region === region &&
      weight >= rule.minWeight &&
      weight <= rule.maxWeight
    ) {
      canShip = true;
      break;
    }
  }

  if (!canShip) return null;

  const matchingRule = rules.find(
    (r) => r.region === region && weight >= r.minWeight && weight <= r.maxWeight
  );
  return matchingRule ? weight * matchingRule.rate : null;
}
```

### After

```typescript
interface ShippingRule {
  minWeight: number;
  maxWeight: number;
  region: string;
  rate: number;
}

function hasValidShippingOption(
  rules: ShippingRule[],
  region: string,
  weight: number
): boolean {
  let found = false;
  for (const rule of rules) {
    if (
      rule.region === region &&
      weight >= rule.minWeight &&
      weight <= rule.maxWeight
    ) {
      found = true;
      break;
    }
  }
  return found;
}

function calculateShipping(
  rules: ShippingRule[],
  region: string,
  weight: number
): number | null {
  if (!hasValidShippingOption(rules, region, weight)) return null;

  const matchingRule = rules.find(
    (r) => r.region === region && weight >= r.minWeight && weight <= r.maxWeight
  );
  return matchingRule ? weight * matchingRule.rate : null;
}
```

## When to Use

- Inline code performs the same logic as an existing function in the codebase or a standard library method.
- The existing function name communicates the intent better than the raw inline code.
- You want to ensure that a behavioral change only needs to be made in one place.
- The inline code is a common pattern (e.g., checking array inclusion, computing a sum) that a well-named utility already handles.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

