---
name: refactoring-replace-primitive-with-object
description: Use when a primitive value (string, number, boolean) has accumulated formatting, validation, or comparison logic scattered across the codebase.
---

# Replace Primitive with Object

**Prompt:** Apply the "Replace Primitive with Object" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Early in development a simple string or number is enough to represent a concept. As the domain grows, that primitive accumulates behavior: formatting, validation, comparison, and parsing logic scattered across the codebase. Wrapping the primitive in its own class gives that behavior a natural home and makes the code easier to understand and extend.

## Mechanics

1. Create a new class for the concept with a constructor that accepts the primitive value.
2. Add a getter that returns the raw value for backward compatibility.
3. Change the field in the host class from the primitive type to the new class.
4. Move any behavior related to the primitive (validation, formatting, comparison) into the new class.
5. Update all callers to work with the new object.
6. Test after each step.

## Example

### Before

```typescript
class Shipment {
  trackingNumber: string;
  priority: string; // "high", "medium", "low"

  constructor(trackingNumber: string, priority: string) {
    this.trackingNumber = trackingNumber;
    this.priority = priority;
  }
}

function isHighPriority(shipment: Shipment): boolean {
  return shipment.priority === "high" || shipment.priority === "rush";
}

function comparePriority(a: Shipment, b: Shipment): number {
  const ranking: Record<string, number> = { high: 3, medium: 2, low: 1 };
  return (ranking[a.priority] ?? 0) - (ranking[b.priority] ?? 0);
}
```

### After

```typescript
class ShipmentPriority {
  private static readonly RANKINGS: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  private readonly _value: string;

  constructor(value: string) {
    if (!(value in ShipmentPriority.RANKINGS)) {
      throw new Error(`Unknown priority: "${value}"`);
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  isHigherThan(other: ShipmentPriority): boolean {
    return this.rank > other.rank;
  }

  isHigh(): boolean {
    return this._value === "high";
  }

  private get rank(): number {
    return ShipmentPriority.RANKINGS[this._value];
  }

  toString(): string {
    return this._value;
  }
}

class Shipment {
  trackingNumber: string;
  priority: ShipmentPriority;

  constructor(trackingNumber: string, priority: string) {
    this.trackingNumber = trackingNumber;
    this.priority = new ShipmentPriority(priority);
  }
}

const urgent = new Shipment("PKG-001", "high");
const regular = new Shipment("PKG-002", "low");
console.log(urgent.priority.isHigherThan(regular.priority)); // true
```

## When to Use

- A primitive value (string, number, boolean) attracts formatting, validation, or comparison logic.
- The same "magic strings" or numeric codes appear in conditional checks across the codebase.
- You find yourself passing a primitive along with helper functions that always operate on it.
- The concept has natural behavior that would be clearer expressed as methods on an object.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

