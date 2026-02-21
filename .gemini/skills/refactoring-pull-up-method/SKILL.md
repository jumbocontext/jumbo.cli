---
name: refactoring-pull-up-method
description: Use when two or more subclasses contain methods with identical or near-identical logic that should be a single authoritative implementation in the superclass.
---

# Pull Up Method

**Prompt:** Apply the "Pull Up Method" refactoring to move identical methods from subclasses into the superclass, eliminating duplication across the inheritance hierarchy.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When two or more subclasses contain methods that perform the same work, that duplication is a breeding ground for bugs. If you fix a defect in one copy but forget to update the others, the classes drift apart silently. Pulling the method up into the superclass guarantees a single authoritative implementation and makes future changes cheaper. Even when the method bodies are not textually identical, they may produce the same result; if you can parameterize the small differences or extract them into helper methods that each subclass overrides, the core logic still belongs in the superclass.

## Mechanics

1. Inspect the candidate methods in each subclass to confirm they do the same thing. If the bodies differ slightly, refactor them until they are identical.
2. Check that the method does not reference any fields or helpers that exist only in one subclass. If it does, consider pulling those up first or extracting them into an overridable method.
3. If the method signatures differ (e.g., different parameter names), unify them to a single signature.
4. Create the method in the superclass and copy the body from one of the subclasses.
5. Remove the method from each subclass.
6. Test after each removal to ensure nothing breaks.

## Example

### Before

```typescript
class Employee {
  protected name: string;
  protected hoursWorked: number;
  protected hourlyRate: number;

  constructor(name: string, hoursWorked: number, hourlyRate: number) {
    this.name = name;
    this.hoursWorked = hoursWorked;
    this.hourlyRate = hourlyRate;
  }
}

class FullTimeEmployee extends Employee {
  monthlySalary(): number {
    return this.hoursWorked * this.hourlyRate;
  }

  displaySummary(): string {
    return `${this.name} — ${this.monthlySalary()}`;
  }
}

class ContractEmployee extends Employee {
  monthlySalary(): number {
    return this.hoursWorked * this.hourlyRate;
  }

  displaySummary(): string {
    return `${this.name} — ${this.monthlySalary()}`;
  }
}
```

### After

```typescript
class Employee {
  protected name: string;
  protected hoursWorked: number;
  protected hourlyRate: number;

  constructor(name: string, hoursWorked: number, hourlyRate: number) {
    this.name = name;
    this.hoursWorked = hoursWorked;
    this.hourlyRate = hourlyRate;
  }

  monthlySalary(): number {
    return this.hoursWorked * this.hourlyRate;
  }

  displaySummary(): string {
    return `${this.name} — ${this.monthlySalary()}`;
  }
}

class FullTimeEmployee extends Employee {}

class ContractEmployee extends Employee {}
```

## When to Use

- Two or more subclasses share methods with identical (or near-identical) logic.
- You want to enforce a single source of truth for shared behavior.
- The duplicated method relies only on state that already lives in the superclass (or can be pulled up alongside it).

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

