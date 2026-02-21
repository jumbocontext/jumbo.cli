---
name: refactoring-pull-up-field
description: Use when multiple subclasses independently declare the same field, duplicating state that represents a concept common to the entire hierarchy.
---

# Pull Up Field

**Prompt:** Apply the "Pull Up Field" refactoring to move a field that appears in multiple subclasses into the superclass, removing duplication.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When several subclasses declare the same field independently, you end up with duplicated state declarations that must be kept in sync. The field typically represents a concept that belongs to every member of the hierarchy, so it naturally belongs in the superclass. Pulling the field up reduces the number of places you need to look when understanding or modifying the data model and opens the door for pulling up any methods that use it.

## Mechanics

1. Inspect all uses of the candidate field in each subclass to confirm it is used in the same way.
2. If the fields do not have the same name, rename them so they match.
3. Create the field in the superclass with appropriate visibility (typically `protected`).
4. Remove the field declaration from every subclass.
5. Test to verify all subclass behavior is preserved.

## Example

### Before

```typescript
class Vehicle {
  constructor(public readonly vin: string) {}

  describe(): string {
    return `Vehicle ${this.vin}`;
  }
}

class Car extends Vehicle {
  protected fuelCapacityLiters: number;

  constructor(vin: string, fuelCapacityLiters: number) {
    super(vin);
    this.fuelCapacityLiters = fuelCapacityLiters;
  }

  range(kmPerLiter: number): number {
    return this.fuelCapacityLiters * kmPerLiter;
  }
}

class Truck extends Vehicle {
  protected fuelCapacityLiters: number;

  constructor(vin: string, fuelCapacityLiters: number) {
    super(vin);
    this.fuelCapacityLiters = fuelCapacityLiters;
  }

  range(kmPerLiter: number): number {
    return this.fuelCapacityLiters * kmPerLiter;
  }
}
```

### After

```typescript
class Vehicle {
  protected fuelCapacityLiters: number;

  constructor(public readonly vin: string, fuelCapacityLiters: number) {
    this.fuelCapacityLiters = fuelCapacityLiters;
  }

  describe(): string {
    return `Vehicle ${this.vin}`;
  }

  range(kmPerLiter: number): number {
    return this.fuelCapacityLiters * kmPerLiter;
  }
}

class Car extends Vehicle {
  constructor(vin: string, fuelCapacityLiters: number) {
    super(vin, fuelCapacityLiters);
  }
}

class Truck extends Vehicle {
  constructor(vin: string, fuelCapacityLiters: number) {
    super(vin, fuelCapacityLiters);
  }
}
```

## When to Use

- Two or more subclasses declare the same field with the same purpose.
- The field represents data common to all (or most) members of the hierarchy.
- You plan to pull up methods that depend on the field.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

