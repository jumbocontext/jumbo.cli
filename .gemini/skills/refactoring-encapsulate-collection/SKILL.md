---
name: refactoring-encapsulate-collection
description: Use when a getter exposes a raw collection that callers can mutate directly, bypassing the owning object's control over invariants and state.
---

# Encapsulate Collection

**Prompt:** Apply the "Encapsulate Collection" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a getter returns a raw collection, any caller can mutate it without the owning object knowing. This breaks encapsulation: the object cannot enforce invariants, react to changes, or even know its own state has changed. Instead, provide dedicated add/remove methods and return a read-only view (or a copy) from the getter.

## Mechanics

1. Ensure the collection field is properly encapsulated with a getter.
2. Add `add` and `remove` methods on the owning class for modifying the collection.
3. Change the getter to return a read-only view or a shallow copy of the collection.
4. Find all callers that modify the collection through the getter and replace them with calls to the new add/remove methods.
5. Remove any setter that accepts an entire collection, or have it copy the incoming collection.
6. Test after each step.

## Example

### Before

```typescript
class Syllabus {
  private _courses: string[] = [];

  get courses(): string[] {
    return this._courses;
  }

  set courses(value: string[]) {
    this._courses = value;
  }
}

const syllabus = new Syllabus();
syllabus.courses.push("Algorithms");
syllabus.courses.push("Algorithms"); // duplicate — no validation
```

### After

```typescript
class Syllabus {
  private _courses: string[] = [];

  get courses(): readonly string[] {
    return [...this._courses];
  }

  addCourse(course: string): void {
    if (this._courses.includes(course)) {
      throw new Error(`Course "${course}" is already in the syllabus.`);
    }
    this._courses.push(course);
  }

  removeCourse(course: string): void {
    const index = this._courses.indexOf(course);
    if (index === -1) {
      throw new Error(`Course "${course}" not found in the syllabus.`);
    }
    this._courses.splice(index, 1);
  }
}

const syllabus = new Syllabus();
syllabus.addCourse("Algorithms");
syllabus.addCourse("Data Structures");
// syllabus.addCourse("Algorithms"); // throws — duplicate prevented
console.log(syllabus.courses); // returns a copy, mutations have no effect
```

## When to Use

- A getter exposes a raw array, set, or map that callers can mutate directly.
- You need to enforce rules about what can be added or removed (uniqueness, size limits, validation).
- You want the owning object to react to collection changes (e.g., logging, event emission).
- Multiple parts of the codebase modify the same collection and you need a single point of control.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

