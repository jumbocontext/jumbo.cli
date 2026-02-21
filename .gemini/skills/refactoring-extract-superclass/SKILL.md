---
name: refactoring-extract-superclass
description: Use when two or more classes share fields and methods with identical implementations, hiding duplication that a common superclass would eliminate.
---

# Extract Superclass

**Prompt:** Apply the "Extract Superclass" refactoring to create a new superclass from two or more classes that share common fields and methods, then have the original classes extend it.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When two classes independently implement similar fields and methods, you have hidden duplication. Over time the implementations drift apart, introducing subtle bugs. Extracting a superclass captures the shared concept in a single place, making the common behavior explicit and reusable. It also opens the door for other code to depend on the superclass abstraction rather than concrete classes, improving flexibility.

## Mechanics

1. Create a new empty superclass.
2. Make the original classes extend the new superclass.
3. Use Pull Up Field to move shared fields into the superclass one at a time, testing after each move.
4. Use Pull Up Constructor Body to move common constructor logic into the superclass.
5. Use Pull Up Method to move shared methods into the superclass one at a time, testing after each move.
6. Examine remaining methods in the subclasses. If they are similar but not identical, consider extracting the common parts into a superclass template method.
7. Check callers: if code works with both classes interchangeably, change the declared type to the new superclass.

## Example

### Before

```typescript
class SalariedEmployee {
  constructor(
    private name: string,
    private annualSalary: number,
    private startDate: Date
  ) {}

  getName(): string {
    return this.name;
  }

  yearsOfService(): number {
    const now = new Date();
    return now.getFullYear() - this.startDate.getFullYear();
  }

  monthlyPay(): number {
    return this.annualSalary / 12;
  }
}

class HourlyContractor {
  constructor(
    private name: string,
    private hourlyRate: number,
    private startDate: Date
  ) {}

  getName(): string {
    return this.name;
  }

  yearsOfService(): number {
    const now = new Date();
    return now.getFullYear() - this.startDate.getFullYear();
  }

  monthlyPay(hoursWorked: number): number {
    return this.hourlyRate * hoursWorked;
  }
}
```

### After

```typescript
abstract class Worker {
  constructor(
    private name: string,
    protected startDate: Date
  ) {}

  getName(): string {
    return this.name;
  }

  yearsOfService(): number {
    const now = new Date();
    return now.getFullYear() - this.startDate.getFullYear();
  }
}

class SalariedEmployee extends Worker {
  constructor(name: string, private annualSalary: number, startDate: Date) {
    super(name, startDate);
  }

  monthlyPay(): number {
    return this.annualSalary / 12;
  }
}

class HourlyContractor extends Worker {
  constructor(name: string, private hourlyRate: number, startDate: Date) {
    super(name, startDate);
  }

  monthlyPay(hoursWorked: number): number {
    return this.hourlyRate * hoursWorked;
  }
}
```

## When to Use

- Two or more classes share fields and methods with identical or very similar implementations.
- The shared behavior represents a meaningful real-world concept worth naming.
- You want callers to depend on an abstraction rather than specific concrete classes.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

