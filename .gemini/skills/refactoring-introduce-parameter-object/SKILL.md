---
name: refactoring-introduce-parameter-object
description: Use when the same cluster of parameters appears across multiple function signatures, suggesting a hidden domain concept worth grouping into an object.
---

# Introduce Parameter Object

**Prompt:** Apply the "Introduce Parameter Object" refactoring to replace a recurring group of parameters with a single data structure.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When the same cluster of data items appears as parameters across multiple functions, it is a sign that they belong together as a concept. Grouping them into a single object reduces parameter list length, makes call sites easier to read, and often reveals behavior that can be moved onto the new object.

## Mechanics

1. If there is no suitable structure for the parameter group, create one
2. Test
3. Use Change Function Declaration to add a parameter of the new type
4. Test
5. Adjust each caller to pass the new object, setting the old parameters from the new structure
6. For each element of the new structure, replace the use of the original parameter with the member of the new object
7. Remove the original parameters one at a time, testing after each removal

## Example

### Before

```typescript
function logTemperatureAlert(stationId: string, reading: number, min: number, max: number): void {
  if (reading < min || reading > max) {
    console.log(`Station ${stationId}: ${reading} is out of range [${min}, ${max}]`);
  }
}

function isWithinRange(reading: number, min: number, max: number): boolean {
  return reading >= min && reading <= max;
}

// callers
logTemperatureAlert("S-12", 47, 30, 90);
const ok = isWithinRange(47, 30, 90);
```

### After

```typescript
interface TemperatureRange {
  readonly min: number;
  readonly max: number;
}

function logTemperatureAlert(stationId: string, reading: number, range: TemperatureRange): void {
  if (reading < range.min || reading > range.max) {
    console.log(`Station ${stationId}: ${reading} is out of range [${range.min}, ${range.max}]`);
  }
}

function isWithinRange(reading: number, range: TemperatureRange): boolean {
  return reading >= range.min && reading <= range.max;
}

// callers
const operatingRange: TemperatureRange = { min: 30, max: 90 };
logTemperatureAlert("S-12", 47, operatingRange);
const ok = isWithinRange(47, operatingRange);
```

## When to Use

- The same group of parameters appears in several function signatures
- You frequently pass subsets of one object's properties as separate arguments
- You want to reveal a hidden domain concept that the parameter group represents

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

