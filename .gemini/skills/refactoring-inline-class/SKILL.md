---
name: refactoring-inline-class
description: Use when a class has been reduced to trivial fields with no meaningful behavior, and folding it into the consuming class would remove pointless indirection.
---

# Inline Class

**Prompt:** Apply the "Inline Class" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Inline Class is the reverse of Extract Class. A class that once justified its existence may have had responsibilities moved elsewhere over time, leaving it with too little behavior to carry its own weight. Keeping it around adds indirection without value. Fold its remaining fields and methods into the class that uses it, then delete the now-empty class.

## Mechanics

1. Identify the target class (the one that will absorb the features) and the source class (the one being inlined).
2. For each public method on the source class, create a corresponding method on the target class that delegates to the source.
3. Update all callers to use the target class methods instead.
4. Move all fields and methods from the source class into the target class, adjusting references.
5. Delete the source class.
6. Test after each step.

## Example

### Before

```typescript
class TrackingInfo {
  private _vendor: string;
  private _trackingId: string;

  constructor(vendor: string, trackingId: string) {
    this._vendor = vendor;
    this._trackingId = trackingId;
  }

  get vendor(): string {
    return this._vendor;
  }

  get trackingId(): string {
    return this._trackingId;
  }

  get display(): string {
    return `${this._vendor}: ${this._trackingId}`;
  }
}

class Shipment {
  private _trackingInfo: TrackingInfo;

  constructor(vendor: string, trackingId: string) {
    this._trackingInfo = new TrackingInfo(vendor, trackingId);
  }

  get trackingInfo(): TrackingInfo {
    return this._trackingInfo;
  }

  get trackingDisplay(): string {
    return this._trackingInfo.display;
  }
}

// Caller
const shipment = new Shipment("FedEx", "98765");
console.log(shipment.trackingInfo.vendor);
console.log(shipment.trackingDisplay);
```

### After

```typescript
class Shipment {
  private _vendor: string;
  private _trackingId: string;

  constructor(vendor: string, trackingId: string) {
    this._vendor = vendor;
    this._trackingId = trackingId;
  }

  get vendor(): string {
    return this._vendor;
  }

  get trackingId(): string {
    return this._trackingId;
  }

  get trackingDisplay(): string {
    return `${this._vendor}: ${this._trackingId}`;
  }
}

// Caller
const shipment = new Shipment("FedEx", "98765");
console.log(shipment.vendor);
console.log(shipment.trackingDisplay);
```

## When to Use

- A class has been reduced to one or two trivial fields and no meaningful behavior.
- The class exists only to hold data that the consuming class always accesses immediately.
- After other refactorings have moved responsibilities away, the class is now an empty shell.
- You want to simplify the object graph before re-extracting classes along better boundaries.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

