---
name: refactoring-change-reference-to-value
description: Use when a nested object is small, not shared, and would be simpler as an immutable value replaced wholesale rather than mutated through a shared reference.
---

# Change Reference to Value

**Prompt:** Apply the "Change Reference to Value" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When you nest an object inside another object, the inner object can be treated as either a reference or a value. With a reference, there is only one instance of the inner object and the outer object holds a pointer to it; updates to the inner object are visible everywhere. With a value, each outer object holds its own copy and changes are made by replacing the entire inner object rather than mutating it. Value objects are much easier to reason about because they are immutable -- you never need to worry about an inner object being changed out from under you by some other part of the code. They are also simpler to work with in distributed and concurrent systems since there are no aliasing concerns. If the inner object is small and does not need to be shared, treating it as a value is usually the better design.

## Mechanics

1. Check that the candidate object is or can become immutable.
2. Remove any setter methods on the candidate object; set all fields via the constructor.
3. Provide a value-based equality method that compares the fields of the object rather than its identity.
4. Test, verifying that equality comparisons now use the value-based method.
5. Wherever the inner object was mutated in place, replace the mutation with creation of a new instance.

## Example

### Before

```typescript
class PhoneNumber {
  private areaCode: string;
  private number: string;

  constructor(areaCode: string, number: string) {
    this.areaCode = areaCode;
    this.number = number;
  }

  getAreaCode(): string {
    return this.areaCode;
  }

  setAreaCode(value: string): void {
    this.areaCode = value;
  }

  getNumber(): string {
    return this.number;
  }

  setNumber(value: string): void {
    this.number = value;
  }
}

class Employee {
  private name: string;
  private officePhone: PhoneNumber;

  constructor(name: string, areaCode: string, number: string) {
    this.name = name;
    this.officePhone = new PhoneNumber(areaCode, number);
  }

  getOfficePhone(): PhoneNumber {
    return this.officePhone;
  }
}

// Usage: mutating the reference in place
const emp = new Employee("Kara Danes", "312", "555-0178");
emp.getOfficePhone().setAreaCode("415");
```

### After

```typescript
class PhoneNumber {
  readonly areaCode: string;
  readonly number: string;

  constructor(areaCode: string, number: string) {
    this.areaCode = areaCode;
    this.number = number;
  }

  equals(other: PhoneNumber): boolean {
    return this.areaCode === other.areaCode && this.number === other.number;
  }

  toString(): string {
    return `(${this.areaCode}) ${this.number}`;
  }
}

class Employee {
  private name: string;
  private officePhone: PhoneNumber;

  constructor(name: string, areaCode: string, number: string) {
    this.name = name;
    this.officePhone = new PhoneNumber(areaCode, number);
  }

  getOfficePhone(): PhoneNumber {
    return this.officePhone;
  }

  setOfficePhone(areaCode: string, number: string): void {
    this.officePhone = new PhoneNumber(areaCode, number);
  }
}

// Usage: replacing the entire value object
const emp = new Employee("Kara Danes", "312", "555-0178");
emp.setOfficePhone("415", "555-0178");
```

## When to Use

- The inner object is small and simple, with only a few fields.
- The inner object does not need to be shared or updated from multiple places.
- You want immutability to simplify reasoning about state changes.
- Mutation of the inner object in place is causing aliasing bugs or confusing behavior.
- The object can naturally be compared by its field values rather than by identity.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

