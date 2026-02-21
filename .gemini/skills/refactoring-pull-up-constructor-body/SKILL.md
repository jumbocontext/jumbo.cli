---
name: refactoring-pull-up-constructor-body
description: Use when subclass constructors repeat the same initialization logic that belongs in the superclass constructor via a super() call.
---

# Pull Up Constructor Body

**Prompt:** Apply the "Pull Up Constructor Body" refactoring to extract common constructor logic from subclasses into a superclass constructor, then call it via `super()`.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Subclass constructors frequently repeat the same initialization steps: assigning shared fields, running validation, or registering with a service. This duplication is easy to introduce and easy to let diverge. By pulling the common assignments into the superclass constructor and having each subclass call `super(...)`, you guarantee that the shared initialization logic stays consistent across the hierarchy and that future changes only need to be made in one place.

## Mechanics

1. If the superclass does not yet have a constructor, create one.
2. Identify the statements in each subclass constructor that are identical (or can be made identical).
3. Move those common statements into the superclass constructor, adding parameters as needed.
4. In each subclass constructor, replace the moved statements with a `super(...)` call passing the appropriate arguments.
5. Move any subclass-specific initialization so it appears after the `super(...)` call.
6. Test after each subclass is updated.

## Example

### Before

```typescript
class Notification {
  // No shared constructor logic yet
}

class EmailNotification extends Notification {
  protected recipient: string;
  protected message: string;
  protected createdAt: Date;
  private subject: string;

  constructor(recipient: string, message: string, subject: string) {
    super();
    this.recipient = recipient;
    this.message = message;
    this.createdAt = new Date();
    this.subject = subject;
  }
}

class SmsNotification extends Notification {
  protected recipient: string;
  protected message: string;
  protected createdAt: Date;
  private phoneNumber: string;

  constructor(recipient: string, message: string, phoneNumber: string) {
    super();
    this.recipient = recipient;
    this.message = message;
    this.createdAt = new Date();
    this.phoneNumber = phoneNumber;
  }
}
```

### After

```typescript
class Notification {
  protected recipient: string;
  protected message: string;
  protected createdAt: Date;

  constructor(recipient: string, message: string) {
    this.recipient = recipient;
    this.message = message;
    this.createdAt = new Date();
  }
}

class EmailNotification extends Notification {
  private subject: string;

  constructor(recipient: string, message: string, subject: string) {
    super(recipient, message);
    this.subject = subject;
  }
}

class SmsNotification extends Notification {
  private phoneNumber: string;

  constructor(recipient: string, message: string, phoneNumber: string) {
    super(recipient, message);
    this.phoneNumber = phoneNumber;
  }
}
```

## When to Use

- Subclass constructors share a block of identical initialization logic.
- The common statements assign fields that logically belong to the superclass.
- You want to ensure all subclasses initialize shared state consistently.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

