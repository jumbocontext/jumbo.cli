---
name: refactoring-remove-setting-method
description: Use when a field should not change after construction but exposes a setter that wrongly signals mutability to other developers.
---

# Remove Setting Method

**Prompt:** Apply the "Remove Setting Method" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a field should not change after an object is created, exposing a setter for it sends the wrong signal. It suggests to other developers that the value can be changed at any time, when in fact it should be immutable after construction. By removing the setter and assigning the field only in the constructor, you make the design intent clear, prevent accidental mutation, and simplify reasoning about object state over time.

## Mechanics

1. If the field is not set in the constructor, move the setting logic into the constructor.
2. Find all calls to the setter outside the constructor. Move each into the constructor call (by adding a constructor parameter if needed).
3. Remove the setter method.
4. If the language supports it, mark the field as `readonly`.
5. Test after each change.

## Example

### Before

```typescript
class Employee {
  private _id: string = "";
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  setId(id: string): void {
    this._id = id;
  }

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }
}

// Caller
const emp = new Employee("Sara");
emp.setId("EMP-042");
```

### After

```typescript
class Employee {
  private readonly _id: string;
  private _name: string;

  constructor(id: string, name: string) {
    this._id = id;
    this._name = name;
  }

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }
}

// Caller
const emp = new Employee("EMP-042", "Sara");
```

## When to Use

- A field is only meaningful at creation time and should never change afterward (e.g., an ID, a creation date, or a type code).
- You want to enforce immutability and prevent accidental mutation of critical fields.
- The setter exists only because of a two-step initialization pattern that can be replaced by a richer constructor.
- You are tightening the API to communicate that the value is fixed once set.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

