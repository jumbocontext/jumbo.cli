---
name: refactoring-consolidate-conditional-expression
description: Use when multiple conditional checks in sequence all lead to the same result, and combining them into a single expression would clarify intent.
---

# Consolidate Conditional Expression

**Prompt:** Apply the "Consolidate Conditional Expression" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When you have a sequence of conditional checks that all lead to the same result, the code is telling you something: these conditions are really one logical check. Keeping them separate obscures that intent and makes the reader wonder whether each branch might eventually do something different. Consolidating the checks into a single expression makes the intent explicit. Once consolidated, the combined condition often becomes a natural candidate for extraction into a well-named function, further improving readability.

## Mechanics

1. Verify that none of the conditional checks have side effects. If they do, you cannot safely consolidate them.
2. Combine the conditions into a single conditional expression using logical operators (`||` for or-conditions, `&&` for and-conditions).
3. Consider extracting the resulting condition into a function with a name that conveys its intent.
4. Test after the consolidation to confirm behavior is unchanged.

## Example

### Before

```typescript
function calculateDisabilityPay(employee: Employee): number {
  if (employee.seniorityInYears < 2) {
    return 0;
  }
  if (employee.monthsDisabled > 12) {
    return 0;
  }
  if (employee.isPartTime) {
    return 0;
  }

  return employee.basePay * 0.6;
}
```

### After

```typescript
function calculateDisabilityPay(employee: Employee): number {
  if (isIneligibleForDisabilityPay(employee)) {
    return 0;
  }

  return employee.basePay * 0.6;
}

function isIneligibleForDisabilityPay(employee: Employee): boolean {
  return (
    employee.seniorityInYears < 2 ||
    employee.monthsDisabled > 12 ||
    employee.isPartTime
  );
}
```

## When to Use

- Multiple conditional checks in sequence all return the same value or perform the same action.
- The checks are logically related and represent a single broader condition.
- You want to give a meaningful name to a combined set of conditions.
- The individual checks have no side effects that depend on evaluation order.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

