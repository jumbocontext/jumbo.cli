---
name: refactoring-extract-class
description: Use when a class has grown to serve two distinct responsibilities, with a subset of fields and methods that cluster into a separate concept.
---

# Extract Class

**Prompt:** Apply the "Extract Class" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Classes grow over time. A class that once had a single responsibility may gradually accumulate fields and methods that serve a second, distinct purpose. When you see a subset of fields that are always used together, or a group of methods that operate on only part of the data, that is a sign a separate class is waiting to be extracted. Splitting the class yields two focused, cohesive objects that are easier to understand, test, and change independently.

## Mechanics

1. Identify the subset of fields and methods that form a coherent group.
2. Create a new class with a name that reflects its responsibility.
3. Create a link from the old class to the new class (a field that holds an instance).
4. Move each relevant field to the new class, one at a time, updating all references.
5. Move each relevant method to the new class, delegating from the old class if needed.
6. Review the interfaces of both classes; remove unnecessary methods and rename for clarity.
7. Decide whether to expose the new class directly or keep it internal.
8. Test after each step.

## Example

### Before

```typescript
class Employee {
  name: string;
  officeAreaCode: string;
  officeNumber: string;
  streetAddress: string;
  city: string;
  postalCode: string;

  constructor(
    name: string,
    officeAreaCode: string,
    officeNumber: string,
    streetAddress: string,
    city: string,
    postalCode: string
  ) {
    this.name = name;
    this.officeAreaCode = officeAreaCode;
    this.officeNumber = officeNumber;
    this.streetAddress = streetAddress;
    this.city = city;
    this.postalCode = postalCode;
  }

  get fullPhone(): string {
    return `(${this.officeAreaCode}) ${this.officeNumber}`;
  }

  get mailingAddress(): string {
    return `${this.streetAddress}, ${this.city} ${this.postalCode}`;
  }
}
```

### After

```typescript
class PhoneNumber {
  constructor(
    private readonly _areaCode: string,
    private readonly _number: string
  ) {}

  get areaCode(): string {
    return this._areaCode;
  }

  get number(): string {
    return this._number;
  }

  toString(): string {
    return `(${this._areaCode}) ${this._number}`;
  }
}

class Address {
  constructor(
    private readonly _street: string,
    private readonly _city: string,
    private readonly _postalCode: string
  ) {}

  get street(): string {
    return this._street;
  }

  get city(): string {
    return this._city;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  toString(): string {
    return `${this._street}, ${this._city} ${this._postalCode}`;
  }
}

class Employee {
  name: string;
  officePhone: PhoneNumber;
  address: Address;

  constructor(
    name: string,
    officePhone: PhoneNumber,
    address: Address
  ) {
    this.name = name;
    this.officePhone = officePhone;
    this.address = address;
  }
}
```

## When to Use

- A class has fields or methods that naturally cluster into a distinct concept.
- You notice a subset of fields that change together while the rest stay stable.
- The class has grown large enough that understanding it requires mental context-switching between unrelated responsibilities.
- Two different consumers use different halves of the same class.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

