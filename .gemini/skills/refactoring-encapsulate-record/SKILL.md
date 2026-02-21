---
name: refactoring-encapsulate-record
description: Use when a plain object or record is passed around and mutated in multiple places, and you need to add validation, derived data, or change tracking.
---

# Encapsulate Record

**Prompt:** Apply the "Encapsulate Record" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Records (plain objects, hash maps, or data literals) are convenient but expose mutable data directly. When clients read and write fields freely, it becomes difficult to track who modifies what, enforce validation, or evolve the data structure over time. Wrapping the record in a class gives you a single place to enforce invariants, add derived values, and control what gets exposed.

## Mechanics

1. Create a class that wraps the record and provides a getter that returns a deep copy of the raw data.
2. For each field in the record, create a getter and setter on the class.
3. Add any validation logic inside the setters.
4. Update all callers to use the new class instead of accessing the raw record.
5. Remove the raw data getter, or have it return a copy to prevent mutation.
6. Test after each step.

## Example

### Before

```typescript
const headquarters = { country: "US", city: "New York", zip: "10001" };

function printMailingLabel(org: Record<string, string>) {
  console.log(`${org.city}, ${org.country} ${org.zip}`);
}

// Any caller can mutate freely
headquarters.zip = "INVALID";
printMailingLabel(headquarters);
```

### After

```typescript
class Organization {
  private _country: string;
  private _city: string;
  private _zip: string;

  constructor(data: { country: string; city: string; zip: string }) {
    this._country = data.country;
    this._city = data.city;
    this._zip = data.zip;
  }

  get country(): string {
    return this._country;
  }

  get city(): string {
    return this._city;
  }

  get zip(): string {
    return this._zip;
  }

  set zip(value: string) {
    if (!/^\d{5}$/.test(value)) {
      throw new Error(`Invalid ZIP code: ${value}`);
    }
    this._zip = value;
  }

  printMailingLabel(): string {
    return `${this._city}, ${this._country} ${this._zip}`;
  }
}

const headquarters = new Organization({ country: "US", city: "New York", zip: "10001" });
console.log(headquarters.printMailingLabel());
```

## When to Use

- A plain object or record is passed around and mutated in multiple places.
- You need to add validation or derived data to a data structure.
- You want to track or log changes to fields.
- The data structure is likely to evolve and you want to insulate callers from changes.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

