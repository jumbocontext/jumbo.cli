---
name: refactoring-preserve-whole-object
description: Use when multiple values are extracted from the same object and passed as separate arguments, creating a fragile parameter list that passing the whole object would simplify.
---

# Preserve Whole Object

**Prompt:** Apply the "Preserve Whole Object" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When you pull several values out of an object only to pass them as individual arguments to a function, you create a long parameter list that is fragile and hard to read. If the function later needs another value from the same object, you must add yet another parameter and update every call site. By passing the whole object instead, the function's signature becomes simpler, future changes require fewer edits, and the relationship between the data and the function is made explicit.

## Mechanics

1. Create an empty function with the desired new signature (receiving the whole object).
2. Move the body of the old function into the new one, replacing the individual parameters with property accesses on the object.
3. Update each caller to pass the whole object instead of extracting and passing individual values.
4. Remove the old function once all callers have been migrated.
5. Test after each change.

## Example

### Before

```typescript
interface TemperatureReading {
  station: string;
  low: number;
  high: number;
  timestamp: Date;
}

function isWithinOperatingRange(low: number, high: number): boolean {
  const operatingMin = -10;
  const operatingMax = 55;
  return low >= operatingMin && high <= operatingMax;
}

// Caller
const reading: TemperatureReading = {
  station: "Alpha-7",
  low: 4,
  high: 38,
  timestamp: new Date(),
};

const safe = isWithinOperatingRange(reading.low, reading.high);
```

### After

```typescript
interface TemperatureReading {
  station: string;
  low: number;
  high: number;
  timestamp: Date;
}

function isWithinOperatingRange(reading: TemperatureReading): boolean {
  const operatingMin = -10;
  const operatingMax = 55;
  return reading.low >= operatingMin && reading.high <= operatingMax;
}

// Caller
const reading: TemperatureReading = {
  station: "Alpha-7",
  low: 4,
  high: 38,
  timestamp: new Date(),
};

const safe = isWithinOperatingRange(reading);
```

## When to Use

- You extract multiple values from the same object and pass them as separate arguments.
- The function already depends on several properties of the same record or entity.
- Adding a new property from the same object would require changing both the function signature and all call sites.
- You want to reduce parameter list length and make the code more resilient to change.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

