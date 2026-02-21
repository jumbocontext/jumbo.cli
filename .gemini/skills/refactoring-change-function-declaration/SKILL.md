---
name: refactoring-change-function-declaration
description: Use when a function name no longer describes what it does, or its parameters need to be added, removed, or reordered to reduce coupling.
---

# Change Function Declaration

**Prompt:** Apply the "Change Function Declaration" refactoring to rename a function or modify its parameter list so it better reflects its purpose and usage.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Function declarations represent the joints in our software systems. Good joints allow easy movement and modification; bad joints are a source of constant pain. A function's name is the first clue to what it does — if a better name occurs to you, change it. Likewise, parameters define how a function interacts with the world; adjusting them can widen applicability or reduce coupling.

## Mechanics

### Simple Mechanic (rename or trivial parameter change)

1. If removing a parameter, ensure it is not referenced in the function body
2. Change the function declaration to the desired signature
3. Find all callers and update them to match
4. Test

### Migration Mechanic (complex or gradual changes)

1. Refactor the function body so it can be wrapped easily
2. Use Extract Function on the function body to create a new function with the desired signature
3. Update callers one at a time to use the new function
4. Remove the old function once all callers have migrated
5. Rename the new function to the original name if desired

## Example

### Before — Renaming

```typescript
function circum(radius: number): number {
  return 2 * Math.PI * radius;
}
```

### After — Renaming

```typescript
function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}
```

### Before — Adding a Parameter

```typescript
function createBooking(customer: Customer, show: Show): Booking {
  return { customer, show, date: show.date, isPremium: false };
}
```

### After — Adding a Parameter

```typescript
function createBooking(customer: Customer, show: Show, isPremium: boolean): Booking {
  return { customer, show, date: show.date, isPremium };
}
```

## When to Use

- A function name no longer describes what the function does
- You discover a better name that communicates intent more clearly
- You need to add, remove, or reorder parameters
- You want to reduce the coupling between a function and its callers

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

