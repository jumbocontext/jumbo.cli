---
name: refactoring-move-function
description: Use when a function references elements in another module more than its own, indicating misplaced responsibility and unnecessary cross-module coupling.
---

# Move Function

**Prompt:** Apply the "Move Function" refactoring to relocate a function to the module or class whose context it references most, reducing coupling and improving cohesion.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

A function that references elements in another context more than its own is a sign of misplaced responsibility. When a function reads data from, or calls methods on, another module far more than its home module, understanding and maintaining it requires constant cross-referencing. Moving the function to the context it uses most makes the code easier to understand, reduces coupling between modules, and often reveals opportunities for further simplification.

## Mechanics

1. Examine the function and everything it references in its current context.
2. Determine whether the function should move to one of its target contexts by checking which context it interacts with the most.
3. Check if the function is polymorphic (overridden in subclasses) and account for that.
4. Copy the function to the target context and adjust it so it fits its new home (update references, parameters, and naming).
5. Perform static analysis or compile to catch references that need updating.
6. Turn the original function into a delegating wrapper that calls the moved function, or remove it and update all callers.
7. Test after each step.
8. Consider applying Inline Function on the delegating wrapper if it adds no value.

## Example

### Before

```typescript
class Account {
  private _daysOverdrawn: number;
  private _type: AccountType;

  constructor(daysOverdrawn: number, type: AccountType) {
    this._daysOverdrawn = daysOverdrawn;
    this._type = type;
  }

  get bankCharge(): number {
    let result = 4.5;
    if (this._daysOverdrawn > 0) {
      result += this.overdraftCharge;
    }
    return result;
  }

  // This function depends heavily on AccountType's data
  get overdraftCharge(): number {
    if (this._type.isPremium) {
      const baseCharge = 10;
      if (this._daysOverdrawn <= 7) {
        return baseCharge;
      } else {
        return baseCharge + (this._daysOverdrawn - 7) * 0.85;
      }
    }
    return this._daysOverdrawn * 1.75;
  }
}

class AccountType {
  private _typeName: string;

  constructor(typeName: string) {
    this._typeName = typeName;
  }

  get isPremium(): boolean {
    return this._typeName === "premium";
  }
}
```

### After

```typescript
class Account {
  private _daysOverdrawn: number;
  private _type: AccountType;

  constructor(daysOverdrawn: number, type: AccountType) {
    this._daysOverdrawn = daysOverdrawn;
    this._type = type;
  }

  get bankCharge(): number {
    let result = 4.5;
    if (this._daysOverdrawn > 0) {
      result += this._type.overdraftCharge(this._daysOverdrawn);
    }
    return result;
  }
}

class AccountType {
  private _typeName: string;

  constructor(typeName: string) {
    this._typeName = typeName;
  }

  get isPremium(): boolean {
    return this._typeName === "premium";
  }

  overdraftCharge(daysOverdrawn: number): number {
    if (this.isPremium) {
      const baseCharge = 10;
      if (daysOverdrawn <= 7) {
        return baseCharge;
      } else {
        return baseCharge + (daysOverdrawn - 7) * 0.85;
      }
    }
    return daysOverdrawn * 1.75;
  }
}
```

## When to Use

- A function reads or writes fields of another class more than its own.
- A helper function is nested inside a module but only serves a single other module.
- A function needs to be called from several places and its current location forces unnecessary imports.
- Moving the function would eliminate a parameter that is only needed to bridge two contexts.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

