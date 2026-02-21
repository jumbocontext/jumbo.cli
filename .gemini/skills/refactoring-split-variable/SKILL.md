---
name: refactoring-split-variable
description: Use when a variable is assigned more than once (excluding loop counters) and serves multiple responsibilities, making the code confusing to follow.
---

# Split Variable

**Prompt:** Apply the "Split Variable" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a variable is assigned more than once, it often signals that the variable has more than one responsibility within a function. Loop variables and collecting variables (such as those used with `reduce` or concatenation) are natural exceptions, but any other variable that gets reassigned is likely serving double duty. Each assignment typically represents a different concept, and giving each concept its own variable makes the code easier to understand. A variable with a single responsibility is simpler to reason about; it clearly communicates what it represents and does not require readers to track changing meaning through the flow of execution.

## Mechanics

1. Change the name of the variable at its declaration and at the first assignment.
2. If possible, declare the new variable as `const` to enforce that it is only assigned once.
3. Change all references to the variable up to the point of its second assignment so they use the new name.
4. Test.
5. Repeat for each subsequent assignment, creating a new variable name for each, and updating references between that assignment and the next.

## Example

### Before

```typescript
function distanceTraveled(scenario: { primaryForce: number; mass: number; delay: number; secondaryForce: number }, time: number): number {
  let result: number;
  let acc = scenario.primaryForce / scenario.mass;
  let primaryTime = Math.min(time, scenario.delay);
  result = 0.5 * acc * primaryTime * primaryTime;

  let secondaryTime = time - scenario.delay;
  if (secondaryTime > 0) {
    let primaryVelocity = acc * scenario.delay;
    acc = (scenario.primaryForce + scenario.secondaryForce) / scenario.mass;
    result += primaryVelocity * secondaryTime + 0.5 * acc * secondaryTime * secondaryTime;
  }

  return result;
}
```

### After

```typescript
function distanceTraveled(scenario: { primaryForce: number; mass: number; delay: number; secondaryForce: number }, time: number): number {
  const primaryAcceleration = scenario.primaryForce / scenario.mass;
  const primaryTime = Math.min(time, scenario.delay);
  let result = 0.5 * primaryAcceleration * primaryTime * primaryTime;

  let secondaryTime = time - scenario.delay;
  if (secondaryTime > 0) {
    const primaryVelocity = primaryAcceleration * scenario.delay;
    const secondaryAcceleration = (scenario.primaryForce + scenario.secondaryForce) / scenario.mass;
    result += primaryVelocity * secondaryTime + 0.5 * secondaryAcceleration * secondaryTime * secondaryTime;
  }

  return result;
}
```

## When to Use

- A variable is assigned more than once and is not a loop counter or collecting variable.
- A variable changes meaning partway through a function, making the code confusing to read.
- You want to use `const` declarations to enforce single-assignment discipline and catch accidental reuse.
- A long function uses a generic variable name (like `temp` or `val`) for multiple distinct purposes.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

