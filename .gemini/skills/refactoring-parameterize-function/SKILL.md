---
name: refactoring-parameterize-function
description: Use when multiple functions carry out the same logic but differ only in literal values embedded in their bodies, creating duplicated code.
---

# Parameterize Function

**Prompt:** Apply the "Parameterize Function" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When two or more functions carry out very similar logic but differ only in literal values embedded in their bodies, you end up with duplicated code that is tedious to maintain. If the logic changes, you must update every variant. By extracting the differing values into parameters of a single unified function, you eliminate the duplication, make the code easier to extend, and reduce the surface area for bugs.

## Mechanics

1. Identify two or more functions with similar bodies that differ only in literal values.
2. Select one of the functions as the base.
3. Add a parameter for each literal value that varies between the functions.
4. Update the body to use the new parameters instead of the hardcoded literals.
5. Replace all calls to the original functions with calls to the parameterized function, passing the appropriate values.
6. Remove the now-unused original functions.
7. Test after each change.

## Example

### Before

```typescript
function tenPercentRaise(salary: number): number {
  return salary * 1.1;
}

function fivePercentRaise(salary: number): number {
  return salary * 1.05;
}

function twentyPercentRaise(salary: number): number {
  return salary * 1.2;
}

// Callers
const updated1 = tenPercentRaise(50000);
const updated2 = fivePercentRaise(60000);
const updated3 = twentyPercentRaise(45000);
```

### After

```typescript
function raise(salary: number, factor: number): number {
  return salary * (1 + factor);
}

// Callers
const updated1 = raise(50000, 0.1);
const updated2 = raise(60000, 0.05);
const updated3 = raise(45000, 0.2);
```

## When to Use

- Multiple functions differ only by literal values in their bodies.
- You find yourself creating a new function every time a new variant of the same logic is needed.
- The functions share the same structure and only the embedded constants change.
- You want to reduce code duplication and make future extensions easier.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

