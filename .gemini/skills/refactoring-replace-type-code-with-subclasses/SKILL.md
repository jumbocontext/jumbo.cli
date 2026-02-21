---
name: refactoring-replace-type-code-with-subclasses
description: Use when a class branches on a type code (string, enum, number) in multiple methods, and subclasses would replace the conditionals with polymorphism.
---

# Replace Type Code with Subclasses

**Prompt:** Apply the "Replace Type Code with Subclasses" refactoring to replace a type code field (often a string or enum) with dedicated subclasses, enabling polymorphic behavior.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a class carries a type code and then scatters `if` / `switch` statements throughout its methods to vary behavior based on that code, you lose the benefits of polymorphism. Each new type requires hunting down every conditional and adding another branch. Replacing the type code with subclasses lets you use method overriding instead of conditionals: each subclass encapsulates the behavior specific to its type. This makes the code easier to extend (add a new subclass) and harder to break (no forgotten branches).

## Mechanics

1. Self-encapsulate the type code field if callers access it directly (create a getter).
2. Pick one type code value. Create a subclass for it and override the type-code getter to return the appropriate value.
3. Create a factory function (or modify the constructor) so that it returns the correct subclass based on the requested type.
4. Repeat for each type code value, creating a subclass each time.
5. Remove the type code field from the superclass (it is now implicitly represented by the class itself).
6. Replace conditionals that switch on the type code with polymorphic method calls.
7. Test after each subclass introduction.

## Example

### Before

```typescript
class Ticket {
  constructor(
    private description: string,
    private type: "bug" | "feature" | "chore",
    private priority: number
  ) {}

  estimateHours(): number {
    switch (this.type) {
      case "bug":
        return this.priority * 2;
      case "feature":
        return this.priority * 5;
      case "chore":
        return this.priority;
    }
  }

  label(): string {
    switch (this.type) {
      case "bug":
        return `[BUG] ${this.description}`;
      case "feature":
        return `[FEATURE] ${this.description}`;
      case "chore":
        return `[CHORE] ${this.description}`;
    }
  }
}
```

### After

```typescript
abstract class Ticket {
  constructor(
    protected description: string,
    protected priority: number
  ) {}

  abstract estimateHours(): number;
  abstract label(): string;

  static create(
    description: string,
    type: "bug" | "feature" | "chore",
    priority: number
  ): Ticket {
    switch (type) {
      case "bug":
        return new BugTicket(description, priority);
      case "feature":
        return new FeatureTicket(description, priority);
      case "chore":
        return new ChoreTicket(description, priority);
    }
  }
}

class BugTicket extends Ticket {
  estimateHours(): number {
    return this.priority * 2;
  }

  label(): string {
    return `[BUG] ${this.description}`;
  }
}

class FeatureTicket extends Ticket {
  estimateHours(): number {
    return this.priority * 5;
  }

  label(): string {
    return `[FEATURE] ${this.description}`;
  }
}

class ChoreTicket extends Ticket {
  estimateHours(): number {
    return this.priority;
  }

  label(): string {
    return `[CHORE] ${this.description}`;
  }
}
```

## When to Use

- A class uses a type code (string, enum, or number) and branches on it in multiple methods.
- Each type code value implies distinct behavior that can be captured in its own class.
- You expect new types to be added in the future and want to avoid modifying existing conditionals.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

