---
name: refactoring-push-down-method
description: Use when a superclass method is only relevant to a subset of its subclasses and clutters the interface for the rest of the hierarchy.
---

# Push Down Method

**Prompt:** Apply the "Push Down Method" refactoring to move a method from a superclass into only the subclass(es) that actually use it.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

A method sitting in a superclass that is only relevant to one (or a few) subclasses clutters the interface for every other subclass in the hierarchy. Callers working with the superclass type may mistakenly call a method that has no meaningful behavior for most subclasses. By pushing the method down, you tighten each class's contract so it only advertises what it actually supports, making the hierarchy easier to understand and safer to extend.

## Mechanics

1. Identify which subclasses actually use (or override) the method.
2. Copy the method body into each subclass that needs it.
3. Remove the method from the superclass.
4. Test to make sure callers that should still reach the method do so, and that callers who should not have access to it no longer do.
5. Remove or update any references in the superclass that depended on the method.

## Example

### Before

```typescript
class Shape {
  protected color: string;

  constructor(color: string) {
    this.color = color;
  }

  area(): number {
    throw new Error("area() must be implemented by subclass");
  }

  // Only circles have a radius — this doesn't belong here
  circumference(radius: number): number {
    return 2 * Math.PI * radius;
  }
}

class Circle extends Shape {
  constructor(color: string, private radius: number) {
    super(color);
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(color: string, private width: number, private height: number) {
    super(color);
  }

  area(): number {
    return this.width * this.height;
  }
}
```

### After

```typescript
class Shape {
  protected color: string;

  constructor(color: string) {
    this.color = color;
  }

  area(): number {
    throw new Error("area() must be implemented by subclass");
  }
}

class Circle extends Shape {
  constructor(color: string, private radius: number) {
    super(color);
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  circumference(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(color: string, private width: number, private height: number) {
    super(color);
  }

  area(): number {
    return this.width * this.height;
  }
}
```

## When to Use

- A superclass method is only relevant to a subset of its subclasses.
- The method references concepts or data that do not apply to the general superclass contract.
- You want to keep the superclass interface lean and focused.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

