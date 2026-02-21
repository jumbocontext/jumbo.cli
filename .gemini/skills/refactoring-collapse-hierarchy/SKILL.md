---
name: refactoring-collapse-hierarchy
description: Use when a superclass and subclass are nearly identical and the extra hierarchy level adds complexity without meaningful distinction.
---

# Collapse Hierarchy

**Prompt:** Apply the "Collapse Hierarchy" refactoring to merge a superclass and subclass that have become too similar to justify separate classes.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Over the course of refactoring, a subclass may lose the distinctions that originally justified its existence. When a superclass and subclass are nearly identical, the extra level of hierarchy adds complexity without adding value. Readers must jump between two classes to understand what is essentially one concept. Collapsing the hierarchy into a single class eliminates this indirection and makes the code simpler to read, test, and maintain.

## Mechanics

1. Decide which class to keep. Typically you keep whichever name best communicates the concept (often the superclass, but not always).
2. Use Pull Up Field / Pull Up Method or Push Down Field / Push Down Method to move all members into the class you are keeping.
3. Update all references to the class you are removing so they point to the surviving class.
4. Delete the now-empty class.
5. Test thoroughly.

## Example

### Before

```typescript
class Reservation {
  protected guestName: string;
  protected checkIn: Date;
  protected checkOut: Date;

  constructor(guestName: string, checkIn: Date, checkOut: Date) {
    this.guestName = guestName;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
  }

  nights(): number {
    const ms = this.checkOut.getTime() - this.checkIn.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  summary(): string {
    return `${this.guestName}: ${this.nights()} night(s)`;
  }
}

class OnlineReservation extends Reservation {
  // Originally had special online-only logic, but it was removed over time.
  // Now this subclass adds nothing.
  constructor(guestName: string, checkIn: Date, checkOut: Date) {
    super(guestName, checkIn, checkOut);
  }
}
```

### After

```typescript
class Reservation {
  private guestName: string;
  private checkIn: Date;
  private checkOut: Date;

  constructor(guestName: string, checkIn: Date, checkOut: Date) {
    this.guestName = guestName;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
  }

  nights(): number {
    const ms = this.checkOut.getTime() - this.checkIn.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  summary(): string {
    return `${this.guestName}: ${this.nights()} night(s)`;
  }
}

// OnlineReservation has been removed. All call sites now use Reservation directly.
```

## When to Use

- A subclass adds no meaningful fields, methods, or overrides beyond what the superclass provides.
- The hierarchy was justified historically but the distinguishing behavior has been removed or moved elsewhere.
- The two classes represent the same real-world concept and separating them creates confusion.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

