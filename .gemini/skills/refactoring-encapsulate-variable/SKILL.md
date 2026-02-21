---
name: refactoring-encapsulate-variable
description: Use when widely accessed data needs a controlled interface for validation, logging, monitoring, or to enable future migration of the underlying storage.
---

# Encapsulate Variable

**Prompt:** Apply the "Encapsulate Variable" refactoring to control access to widely used data by routing reads and writes through functions.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Data is harder to manipulate than functions. When you need to move or change widely accessed data, you first encapsulate it behind functions so that you have a clear interface to monitor and evolve. This provides a single point of control for validation, logging, or migration, and makes it far easier to refactor the underlying data later.

## Mechanics

1. Create encapsulating getter (and setter if needed) functions for the variable
2. Run a search for all references to the variable and replace each with a call to the appropriate getter or setter
3. Restrict the visibility of the variable (e.g., move it into a module scope or mark it private)
4. Test
5. If the variable is a record, consider returning a copy or immutable view from the getter to prevent uncontrolled mutation

## Example

### Before

```typescript
// config.ts
export let defaultTaxRate = 0.08;
export let defaultCurrency = "USD";

// checkout.ts
import { defaultTaxRate, defaultCurrency } from "./config";

function calculateTotal(subtotal: number): string {
  const tax = subtotal * defaultTaxRate;
  return `${(subtotal + tax).toFixed(2)} ${defaultCurrency}`;
}
```

### After

```typescript
// config.ts
let _defaultTaxRate = 0.08;
let _defaultCurrency = "USD";

export function getDefaultTaxRate(): number {
  return _defaultTaxRate;
}

export function setDefaultTaxRate(rate: number): void {
  if (rate < 0 || rate > 1) throw new RangeError("Tax rate must be between 0 and 1");
  _defaultTaxRate = rate;
}

export function getDefaultCurrency(): string {
  return _defaultCurrency;
}

export function setDefaultCurrency(currency: string): void {
  _defaultCurrency = currency;
}

// checkout.ts
import { getDefaultTaxRate, getDefaultCurrency } from "./config";

function calculateTotal(subtotal: number): string {
  const tax = subtotal * getDefaultTaxRate();
  return `${(subtotal + tax).toFixed(2)} ${getDefaultCurrency()}`;
}
```

## When to Use

- A global or module-level variable is referenced by many parts of the codebase
- You need to add validation or side effects when data changes
- You plan to move the data to a different storage mechanism later
- You want to monitor or log how data is accessed or modified

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

