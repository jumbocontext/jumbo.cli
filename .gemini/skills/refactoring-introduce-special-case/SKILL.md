---
name: refactoring-introduce-special-case
description: Use when many places check for the same special-case value (null, unknown, empty) and respond with the same default behavior that could be encapsulated in a Null Object.
---

# Introduce Special Case

**Prompt:** Apply the "Introduce Special Case" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When many places in the code check for a particular value -- most commonly null or an "unknown" sentinel -- and then perform the same default behavior, the repeated checks clutter the code and risk inconsistency if one site is missed. By introducing a special-case object that provides the default behavior directly, you eliminate all the scattered conditional checks. The special-case object conforms to the same interface as the real object, so calling code does not need to know it is dealing with a special case. This pattern is sometimes called the Null Object pattern when the special case replaces null.

## Mechanics

1. Identify the repeated conditional checks for the special-case value and catalog the common behavior they produce.
2. Create a special-case class (or literal object) that implements the same interface as the normal object, providing the default behavior directly.
3. Add a method or property to detect the special case at the source (e.g., a factory method or a check at the point where the value is assigned).
4. Replace each conditional check site with usage of the special-case object, removing the conditional.
5. Test after each replacement to ensure behavior is preserved.

## Example

### Before

```typescript
interface Customer {
  name: string;
  plan: string;
  discountRate: number;
}

function getCustomerByName(name: string): Customer | null {
  // ... lookup logic
  return null; // not found
}

// Scattered across the codebase:
function displayCustomerName(customer: Customer | null): string {
  if (customer === null) {
    return "Valued Guest";
  }
  return customer.name;
}

function getDiscountRate(customer: Customer | null): number {
  if (customer === null) {
    return 0;
  }
  return customer.discountRate;
}

function getPlanLabel(customer: Customer | null): string {
  if (customer === null) {
    return "None";
  }
  return customer.plan;
}
```

### After

```typescript
interface Customer {
  name: string;
  plan: string;
  discountRate: number;
  isUnknown: boolean;
}

function createUnknownCustomer(): Customer {
  return {
    name: "Valued Guest",
    plan: "None",
    discountRate: 0,
    isUnknown: true,
  };
}

function getCustomerByName(name: string): Customer {
  // ... lookup logic
  // Instead of returning null, return the special case:
  return createUnknownCustomer();
}

// All conditional checks are eliminated:
function displayCustomerName(customer: Customer): string {
  return customer.name;
}

function getDiscountRate(customer: Customer): number {
  return customer.discountRate;
}

function getPlanLabel(customer: Customer): string {
  return customer.plan;
}
```

## When to Use

- Multiple places in the code check for the same special-case value (null, "unknown", empty, etc.) and respond with the same default behavior.
- The default behavior for the special case can be encapsulated in an object that shares the same interface as the normal case.
- You want to reduce duplication and the risk of forgetting a null check in a new call site.
- The special case has well-defined, stable behavior that is unlikely to vary across call sites.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

