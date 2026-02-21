---
name: refactoring-replace-function-with-command
description: Use when a function needs undo/redo, queuing, incremental parameter building, or lifecycle hooks that a plain function cannot support.
---

# Replace Function with Command

**Prompt:** Apply the "Replace Function with Command" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

A plain function is usually the simplest option, but sometimes you need more flexibility than a function alone can offer. Turning a function into a command object (an object whose primary purpose is to execute a single action) gives you the ability to support undo operations, build up parameters incrementally, maintain execution history, and leverage inheritance or composition for varying behaviors. The command object makes the function's lifecycle explicit and opens the door to richer interactions.

## Mechanics

1. Create a new class and name it after the function (or the action it performs).
2. Move the function body into an `execute` method on the new class.
3. Move each parameter of the function into the constructor or the `execute` method, as appropriate. Parameters that represent context or configuration go in the constructor; per-invocation data goes in `execute`.
4. Replace each call to the original function with creation of the command object followed by a call to `execute`.
5. Remove the original function once all callers are migrated.
6. Test after each change.

## Example

### Before

```typescript
function calculateScore(
  candidate: { baseRating: number; experienceYears: number },
  reviews: { score: number }[],
  hasCertification: boolean,
): number {
  let total = candidate.baseRating * 10;

  if (candidate.experienceYears > 5) {
    total += 20;
  }

  for (const review of reviews) {
    total += review.score;
  }

  if (hasCertification) {
    total *= 1.2;
  }

  return Math.round(total);
}

// Caller
const score = calculateScore(
  { baseRating: 7, experienceYears: 8 },
  [{ score: 4 }, { score: 5 }],
  true,
);
```

### After

```typescript
class ScoreCalculator {
  private candidate: { baseRating: number; experienceYears: number };
  private reviews: { score: number }[];
  private hasCertification: boolean;

  constructor(
    candidate: { baseRating: number; experienceYears: number },
    reviews: { score: number }[],
    hasCertification: boolean,
  ) {
    this.candidate = candidate;
    this.reviews = reviews;
    this.hasCertification = hasCertification;
  }

  execute(): number {
    let total = this.candidate.baseRating * 10;

    if (this.candidate.experienceYears > 5) {
      total += 20;
    }

    for (const review of this.reviews) {
      total += review.score;
    }

    if (this.hasCertification) {
      total *= 1.2;
    }

    return Math.round(total);
  }
}

// Caller
const calculator = new ScoreCalculator(
  { baseRating: 7, experienceYears: 8 },
  [{ score: 4 }, { score: 5 }],
  true,
);
const score = calculator.execute();
```

## When to Use

- The function is complex and would benefit from being broken into smaller private methods on an object.
- You need to support undo, redo, or execution history.
- You want to queue or schedule the operation for later execution.
- You need to build up parameters incrementally before executing.
- The function requires lifecycle hooks (before/after execution, logging, validation).

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

