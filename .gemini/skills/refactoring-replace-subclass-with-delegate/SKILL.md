---
name: refactoring-replace-subclass-with-delegate
description: Use when behavior needs to vary along multiple dimensions or change at runtime, and inheritance cannot express the combinations that composition would.
---

# Replace Subclass with Delegate

**Prompt:** Apply the "Replace Subclass with Delegate" refactoring to replace inheritance-based variation with composition, delegating varying behavior to a separate object.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Inheritance is a powerful mechanism, but it has a key limitation: a class can only vary along one axis at a time. If you need to vary behavior along two or more dimensions, or if subclasses are used solely to select a strategy at construction time and never benefit from the "is-a" relationship, inheritance becomes a constraint rather than a help. Replacing the subclass with a delegate (composition) lets you swap behavior independently, combine variations freely, and change behavior at runtime. It also decouples the varying behavior from the host class's identity, leading to a more flexible design.

## Mechanics

1. If there are multiple callers that construct the subclass directly, introduce a factory method on the superclass.
2. Create a delegate class that accepts a back-reference to the host (if needed) and contains the behavior that varies.
3. Add a delegate field to the superclass.
4. Modify the factory method to create the appropriate delegate and attach it to the host instance instead of returning a subclass.
5. Move each overriding method from the subclass into the delegate. In the superclass, forward to the delegate.
6. Remove the subclass once all behavior has been moved.
7. Test after each method migration.

## Example

### Before

```typescript
class Logger {
  log(message: string): void {
    const entry = this.format(message);
    console.log(entry);
  }

  protected format(message: string): string {
    return message;
  }
}

class TimestampedLogger extends Logger {
  protected format(message: string): string {
    return `[${new Date().toISOString()}] ${message}`;
  }
}

class PrefixedLogger extends Logger {
  constructor(private prefix: string) {
    super();
  }

  protected format(message: string): string {
    return `${this.prefix}: ${message}`;
  }
}

// Problem: cannot combine timestamp AND prefix without creating yet another subclass.
```

### After

```typescript
interface LogFormatter {
  format(message: string): string;
}

class PlainFormatter implements LogFormatter {
  format(message: string): string {
    return message;
  }
}

class TimestampFormatter implements LogFormatter {
  format(message: string): string {
    return `[${new Date().toISOString()}] ${message}`;
  }
}

class PrefixFormatter implements LogFormatter {
  constructor(private prefix: string) {}

  format(message: string): string {
    return `${this.prefix}: ${message}`;
  }
}

class Logger {
  private formatter: LogFormatter;

  constructor(formatter?: LogFormatter) {
    this.formatter = formatter ?? new PlainFormatter();
  }

  log(message: string): void {
    const entry = this.formatter.format(message);
    console.log(entry);
  }

  setFormatter(formatter: LogFormatter): void {
    this.formatter = formatter;
  }
}

// Now you can compose behavior freely:
const logger = new Logger(new TimestampFormatter());
logger.log("Server started");

// And switch at runtime:
logger.setFormatter(new PrefixFormatter("ERROR"));
logger.log("Connection refused");
```

## When to Use

- You need to vary behavior along more than one dimension and inheritance cannot express the combinations.
- Subclasses exist only to select a strategy at construction time with no real "is-a" relationship.
- You need to change behavior at runtime, which inheritance does not support.
- The subclass hierarchy is growing unwieldy with too many small, single-purpose subclasses.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

