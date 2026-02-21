---
name: refactoring-hide-delegate
description: Use when clients reach through one object to access another, creating coupling to the delegate's interface that should be hidden behind a wrapper method.
---

# Hide Delegate

**Prompt:** Apply the "Hide Delegate" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a client reaches through one object to get to another, it creates a dependency on the delegate's interface. If the delegate changes, every client that navigates to it must be updated. By adding a wrapper method on the server object, you hide the delegate entirely. The client only depends on the server, and the server is free to change its internal delegation without rippling changes through callers.

## Mechanics

1. For each method on the delegate that the client calls, create a corresponding delegating method on the server.
2. Update the client to call the server method instead of navigating to the delegate.
3. After all clients have been updated, remove the server's accessor that exposes the delegate (if no longer needed).
4. Test after each step.

## Example

### Before

```typescript
class Department {
  private _manager: string;
  private _chargeCode: string;

  constructor(manager: string, chargeCode: string) {
    this._manager = manager;
    this._chargeCode = chargeCode;
  }

  get manager(): string {
    return this._manager;
  }

  get chargeCode(): string {
    return this._chargeCode;
  }
}

class Person {
  private _name: string;
  private _department: Department;

  constructor(name: string, department: Department) {
    this._name = name;
    this._department = department;
  }

  get name(): string {
    return this._name;
  }

  get department(): Department {
    return this._department;
  }
}

// Client reaches through Person to Department
const engineering = new Department("Alice", "ENG-01");
const dev = new Person("Bob", engineering);
console.log(dev.department.manager);    // client knows about Department
console.log(dev.department.chargeCode); // client knows about Department
```

### After

```typescript
class Department {
  private _manager: string;
  private _chargeCode: string;

  constructor(manager: string, chargeCode: string) {
    this._manager = manager;
    this._chargeCode = chargeCode;
  }

  get manager(): string {
    return this._manager;
  }

  get chargeCode(): string {
    return this._chargeCode;
  }
}

class Person {
  private _name: string;
  private _department: Department;

  constructor(name: string, department: Department) {
    this._name = name;
    this._department = department;
  }

  get name(): string {
    return this._name;
  }

  get manager(): string {
    return this._department.manager;
  }

  get chargeCode(): string {
    return this._department.chargeCode;
  }
}

// Client no longer needs to know about Department
const engineering = new Department("Alice", "ENG-01");
const dev = new Person("Bob", engineering);
console.log(dev.manager);    // delegates internally
console.log(dev.chargeCode); // delegates internally
```

## When to Use

- Clients navigate through one object to reach another, creating coupling to the delegate's interface.
- Changes to the delegate's API force updates in many unrelated client files.
- You want to enforce the Law of Demeter ("only talk to your immediate friends").
- The delegate is an implementation detail that clients should not need to know about.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

