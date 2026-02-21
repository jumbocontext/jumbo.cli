---
name: refactoring-remove-subclass
description: Use when a subclass only overrides trivial accessors or returns a constant, adding class overhead without meaningful polymorphic behavior.
---

# Remove Subclass

**Prompt:** Apply the "Remove Subclass" refactoring to replace a subclass that does too little with a field in the superclass, simplifying the hierarchy.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Subclasses that once justified their existence may shrink over time as behavior is refactored or removed. When a subclass does nothing more than return a different value from a single accessor, the cost of the extra class outweighs the benefit. The indirection makes the code harder to navigate, and the class hierarchy harder to reason about. Replacing the subclass with a field in the superclass collapses unnecessary complexity while preserving the distinguishing data.

## Mechanics

1. If callers use the subclass constructor directly, introduce a factory method on the superclass that returns the appropriate instance. Migrate callers to the factory.
2. Create a field in the superclass to represent the distinction the subclass was modeling (e.g., a `type` string).
3. Change the factory method so it sets the new field and returns a superclass instance instead of the subclass.
4. Move any tiny overriding methods from the subclass into the superclass, guarded by the new field if necessary.
5. Delete the subclass.
6. Test after each step.

## Example

### Before

```typescript
class Subscription {
  constructor(protected customerName: string, protected monthlyPrice: number) {}

  planName(): string {
    return "standard";
  }

  invoice(): string {
    return `${this.customerName}: $${this.monthlyPrice}/mo (${this.planName()})`;
  }
}

class PremiumSubscription extends Subscription {
  planName(): string {
    return "premium";
  }
}

class TrialSubscription extends Subscription {
  planName(): string {
    return "trial";
  }
}

// Usage
const sub = new PremiumSubscription("Alice", 29.99);
```

### After

```typescript
class Subscription {
  private plan: string;

  constructor(
    private customerName: string,
    private monthlyPrice: number,
    plan: string = "standard"
  ) {
    this.plan = plan;
  }

  planName(): string {
    return this.plan;
  }

  invoice(): string {
    return `${this.customerName}: $${this.monthlyPrice}/mo (${this.planName()})`;
  }

  static createPremium(customerName: string, monthlyPrice: number): Subscription {
    return new Subscription(customerName, monthlyPrice, "premium");
  }

  static createTrial(customerName: string, monthlyPrice: number): Subscription {
    return new Subscription(customerName, monthlyPrice, "trial");
  }
}

// Usage
const sub = Subscription.createPremium("Alice", 29.99);
```

## When to Use

- A subclass only overrides one or two trivial accessors or returns a constant value.
- The subclass no longer carries meaningful behavioral differences.
- The extra class adds cognitive overhead without providing real polymorphic value.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

