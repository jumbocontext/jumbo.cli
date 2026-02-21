---
name: refactoring-replace-conditional-with-polymorphism
description: Use when a switch or if-else chain selects behavior based on a type discriminator, and each new type requires updating every such conditional.
---

# Replace Conditional with Polymorphism

**Prompt:** Apply the "Replace Conditional with Polymorphism" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When you have a conditional that switches on a type code or discriminator to choose different behavior, each time you add a new type you must find and update every such conditional. This scatters related logic across the codebase and makes extensions error-prone. By moving each leg of the conditional into an overriding method on a subclass (or implementing class), you co-locate all the behavior for a given type in one place. Adding a new type then means adding a new class rather than hunting down switch statements. The type system itself enforces that every variant provides the required behavior.

## Mechanics

1. If the conditional logic is not already in a class, create a base class or interface with the method that contains the conditional.
2. Create a subclass for each leg of the conditional.
3. In each subclass, override the method to contain the logic from the corresponding conditional branch.
4. Replace the conditional in the base class with abstract or default behavior.
5. Replace the creation site with logic that instantiates the appropriate subclass (often a factory function).
6. Test after each step to ensure behavior is preserved.

## Example

### Before

```typescript
interface ShippingRequest {
  type: "standard" | "express" | "overnight";
  weightKg: number;
  distanceKm: number;
}

function calculateShippingCost(request: ShippingRequest): number {
  switch (request.type) {
    case "standard":
      return request.weightKg * 0.5 + request.distanceKm * 0.01;
    case "express":
      return request.weightKg * 0.75 + request.distanceKm * 0.02 + 5.0;
    case "overnight":
      return request.weightKg * 1.5 + request.distanceKm * 0.05 + 15.0;
    default:
      throw new Error(`Unknown shipping type: ${request.type}`);
  }
}
```

### After

```typescript
abstract class ShippingCalculator {
  constructor(
    protected weightKg: number,
    protected distanceKm: number,
  ) {}

  abstract calculateCost(): number;
}

class StandardShipping extends ShippingCalculator {
  calculateCost(): number {
    return this.weightKg * 0.5 + this.distanceKm * 0.01;
  }
}

class ExpressShipping extends ShippingCalculator {
  calculateCost(): number {
    return this.weightKg * 0.75 + this.distanceKm * 0.02 + 5.0;
  }
}

class OvernightShipping extends ShippingCalculator {
  calculateCost(): number {
    return this.weightKg * 1.5 + this.distanceKm * 0.05 + 15.0;
  }
}

function createShippingCalculator(
  type: "standard" | "express" | "overnight",
  weightKg: number,
  distanceKm: number,
): ShippingCalculator {
  switch (type) {
    case "standard":
      return new StandardShipping(weightKg, distanceKm);
    case "express":
      return new ExpressShipping(weightKg, distanceKm);
    case "overnight":
      return new OvernightShipping(weightKg, distanceKm);
  }
}
```

## When to Use

- A switch or if-else chain selects behavior based on a type discriminator.
- Multiple functions contain parallel conditional structures switching on the same type.
- You expect new types to be added over time and want to minimize the number of places that need to change.
- Each branch of the conditional contains substantial, self-contained logic.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

