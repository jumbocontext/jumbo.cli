---
name: refactoring-replace-parameter-with-query
description: Use when a parameter is redundant because the function can derive the value from information it already has access to, and every caller computes the same value.
---

# Replace Parameter with Query

**Prompt:** Apply the "Replace Parameter with Query" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a caller computes a value from data already available to the called function and then passes it as a parameter, the parameter is redundant. It adds noise to the function signature, burdens every caller with the same computation, and creates a risk of inconsistency if different callers compute the value differently. By removing the parameter and letting the function derive the value itself, you simplify the calling code and centralize the logic in one place.

## Mechanics

1. If the derivation logic is not already present in the function, extract it into a helper or write it inline.
2. Replace references to the parameter inside the function body with the derived value.
3. Remove the parameter from the function signature.
4. Update all callers to stop passing the now-removed argument.
5. Test after each change.

## Example

### Before

```typescript
class Product {
  constructor(
    private basePrice: number,
    private discountRate: number,
  ) {}

  getDiscountRate(): number {
    return this.discountRate;
  }

  getBasePrice(): number {
    return this.basePrice;
  }

  finalPrice(discountLevel: number): number {
    return this.basePrice - this.basePrice * discountLevel;
  }
}

// Caller
const product = new Product(100, 0.15);
const price = product.finalPrice(product.getDiscountRate());
```

### After

```typescript
class Product {
  constructor(
    private basePrice: number,
    private discountRate: number,
  ) {}

  getDiscountRate(): number {
    return this.discountRate;
  }

  getBasePrice(): number {
    return this.basePrice;
  }

  finalPrice(): number {
    return this.basePrice - this.basePrice * this.discountRate;
  }
}

// Caller
const product = new Product(100, 0.15);
const price = product.finalPrice();
```

## When to Use

- The parameter value can be derived from information the function already has access to (its own fields, other parameters, or a global reference that is stable).
- Every caller computes the same value before passing it.
- You want to reduce the parameter list and eliminate redundant coupling between caller and callee.
- Be cautious: do not apply this if deriving the value would introduce an unwanted dependency or side effect into the function.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

