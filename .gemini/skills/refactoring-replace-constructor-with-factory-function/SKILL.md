---
name: refactoring-replace-constructor-with-factory-function
description: Use when construction logic involves subclass selection, needs a descriptive name, or requires hiding the concrete class behind an interface.
---

# Replace Constructor with Factory Function

**Prompt:** Apply the "Replace Constructor with Factory Function" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Constructors in many languages carry restrictions: they must return an instance of the declaring class, they cannot have descriptive names, and they may force awkward patterns when the creation logic involves conditionals or subclass selection. A factory function has none of these constraints. It can return different types, have a name that communicates intent, and encapsulate complex creation logic. By replacing a constructor with a factory function, you gain flexibility without losing clarity.

## Mechanics

1. Create a factory function whose body calls the existing constructor and returns the result.
2. Replace each call to the constructor with a call to the factory function.
3. Reduce the constructor's visibility if possible (e.g., make it private) so new callers are guided toward the factory.
4. Optionally rename the factory function to better describe the creation intent.
5. Test after each change.

## Example

### Before

```typescript
class Notification {
  readonly title: string;
  readonly body: string;
  readonly channel: "email" | "sms" | "push";

  constructor(title: string, body: string, channel: "email" | "sms" | "push") {
    this.title = title;
    this.body = body;
    this.channel = channel;
  }
}

// Callers
const n1 = new Notification("Welcome", "Thanks for joining!", "email");
const n2 = new Notification("Code: 9921", "Your verification code is 9921", "sms");
const n3 = new Notification("New message", "You have a new message", "push");
```

### After

```typescript
class Notification {
  readonly title: string;
  readonly body: string;
  readonly channel: "email" | "sms" | "push";

  private constructor(title: string, body: string, channel: "email" | "sms" | "push") {
    this.title = title;
    this.body = body;
    this.channel = channel;
  }

  static createEmail(title: string, body: string): Notification {
    return new Notification(title, body, "email");
  }

  static createSms(title: string, body: string): Notification {
    return new Notification(title, body, "sms");
  }

  static createPush(title: string, body: string): Notification {
    return new Notification(title, body, "push");
  }
}

// Callers
const n1 = Notification.createEmail("Welcome", "Thanks for joining!");
const n2 = Notification.createSms("Code: 9921", "Your verification code is 9921");
const n3 = Notification.createPush("New message", "You have a new message");
```

## When to Use

- The construction logic involves selecting a subclass or variant based on a type code or input.
- You want a more descriptive name than `new ClassName(...)` at the call site.
- The constructor has constraints (e.g., it must return the exact class type) that limit your design.
- You want to hide the concrete class and program to an interface instead.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

