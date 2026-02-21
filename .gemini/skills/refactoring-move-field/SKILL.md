---
name: refactoring-move-field
description: Use when a field is accessed more by another class than its owner, or needs to move to a different class to improve data locality and reduce coupling.
---

# Move Field

**Prompt:** Apply the "Move Field" refactoring to relocate a field to the class that uses it most, improving data locality and reducing coupling.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Data structures are the foundation of good code. When a field is accessed more frequently by another class than by the class that owns it, every access requires reaching across the class boundary. This cross-referencing makes both classes harder to understand in isolation. Moving the field to the class that uses it most simplifies the code, reduces coupling, and often surfaces a clearer domain model. Getting data structures right early pays dividends for every future change.

## Mechanics

1. Ensure the source field is encapsulated (accessed via getter/setter, not directly).
2. Create the field, along with accessor methods, on the target class.
3. Perform static analysis or compile to verify the target class builds correctly.
4. Update the source class accessor to delegate to the target object's field.
5. Test.
6. Update all callers of the source accessor to use the target directly where appropriate.
7. Remove the delegating accessor and the original field from the source class.
8. Test.

## Example

### Before

```typescript
class Customer {
  private _name: string;
  private _discountRate: number;
  private _contract: CustomerContract;

  constructor(name: string, discountRate: number, startDate: Date) {
    this._name = name;
    this._discountRate = discountRate;
    this._contract = new CustomerContract(startDate);
  }

  get discountRate(): number {
    return this._discountRate;
  }

  applyDiscount(amount: number): number {
    return amount - amount * this._discountRate;
  }
}

class CustomerContract {
  private _startDate: Date;

  constructor(startDate: Date) {
    this._startDate = startDate;
  }

  get startDate(): Date {
    return this._startDate;
  }
}
```

### After

```typescript
class Customer {
  private _name: string;
  private _contract: CustomerContract;

  constructor(name: string, discountRate: number, startDate: Date) {
    this._name = name;
    this._contract = new CustomerContract(startDate, discountRate);
  }

  get discountRate(): number {
    return this._contract.discountRate;
  }

  applyDiscount(amount: number): number {
    return amount - amount * this._contract.discountRate;
  }
}

class CustomerContract {
  private _startDate: Date;
  private _discountRate: number;

  constructor(startDate: Date, discountRate: number) {
    this._startDate = startDate;
    this._discountRate = discountRate;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get discountRate(): number {
    return this._discountRate;
  }
}
```

## When to Use

- A field is read or written by another class more often than by its own class.
- You need to move a field to make a subsequent Move Function refactoring possible.
- A group of fields that are always used together should live on the same class.
- The field conceptually belongs to a different domain entity than where it currently resides.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

