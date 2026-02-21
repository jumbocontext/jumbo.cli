---
name: refactoring-substitute-algorithm
description: Use when a function body can be replaced wholesale with a clearer, simpler, or more efficient approach such as a standard library method.
---

# Substitute Algorithm

**Prompt:** Apply the "Substitute Algorithm" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Sometimes you find a function whose body can be replaced with a clearer or more efficient approach. You may have learned a library method that does the same thing, or you may simply see a simpler way to express the logic after gaining a better understanding of the problem. When the new algorithm is easier to read, modify, or extend, replace the old one wholesale rather than trying to incrementally transform it.

## Mechanics

1. Make sure the current algorithm is well-covered by tests so you can verify the substitution.
2. Prepare the new algorithm in a separate function or alongside the old one.
3. Run the tests against the new algorithm.
4. If the results match, replace the old algorithm with the new one.
5. Run all tests again and compare outputs for edge cases.
6. Remove the old implementation.

## Example

### Before

```typescript
function findStaffMember(people: string[]): string | undefined {
  for (let i = 0; i < people.length; i++) {
    if (people[i] === "Alice") {
      return "Alice";
    }
    if (people[i] === "Bob") {
      return "Bob";
    }
    if (people[i] === "Charlie") {
      return "Charlie";
    }
  }
  return undefined;
}
```

### After

```typescript
function findStaffMember(people: string[]): string | undefined {
  const knownStaff = new Set(["Alice", "Bob", "Charlie"]);
  return people.find((person) => knownStaff.has(person));
}
```

## When to Use

- You discover a standard library function or built-in that does what your handwritten code does.
- A complex conditional or loop can be expressed more simply with a different approach.
- Performance profiling reveals a better data structure or strategy for the same task.
- You understand the problem better now and see a way to express the logic more directly.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

