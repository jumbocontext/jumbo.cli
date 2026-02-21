---
name: refactoring-slide-statements
description: Use when related statements are scattered across a function separated by unrelated logic, and grouping them together would improve readability or enable extraction.
---

# Slide Statements

**Prompt:** Apply the "Slide Statements" refactoring to move related code lines together so they are adjacent, making the code easier to read and setting up further refactoring.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Code is easier to understand when related statements are grouped together. When a variable declaration sits at the top of a function but is only used thirty lines later, the reader must hold that declaration in memory across unrelated logic. Sliding related statements together makes the code's intent clearer, reduces the mental load on the reader, and often sets the stage for Extract Function by placing all the code for a single concern in one contiguous block.

## Mechanics

1. Identify the target position where you want to move the statement(s).
2. Check whether the statement(s) can be moved there without changing observable behavior. Look for:
   - References to the statement's declared variables or side effects.
   - Statements that modify or read the same data between the source and target positions.
3. Move the statement(s) to the target position.
4. Test.

The key safety check is ensuring no data dependency or side-effect ordering is violated by the move.

## Example

### Before

```typescript
interface OrderLine {
  product: string;
  unitPrice: number;
  quantity: number;
}

function processOrder(lines: OrderLine[], taxRate: number): string {
  const discountThreshold = 500;
  let totalBeforeDiscount = 0;
  const summary: string[] = [];
  let discountApplied = false;

  for (const line of lines) {
    const lineTotal = line.unitPrice * line.quantity;
    summary.push(`${line.product}: $${lineTotal.toFixed(2)}`);
    totalBeforeDiscount += lineTotal;
  }

  const tax = totalBeforeDiscount * taxRate;

  if (totalBeforeDiscount > discountThreshold) {
    discountApplied = true;
  }

  const discount = discountApplied ? totalBeforeDiscount * 0.1 : 0;
  const finalTotal = totalBeforeDiscount - discount + tax;

  summary.push(`Subtotal: $${totalBeforeDiscount.toFixed(2)}`);
  summary.push(`Tax: $${tax.toFixed(2)}`);
  summary.push(`Total: $${finalTotal.toFixed(2)}`);

  return summary.join("\n");
}
```

### After

```typescript
interface OrderLine {
  product: string;
  unitPrice: number;
  quantity: number;
}

function processOrder(lines: OrderLine[], taxRate: number): string {
  const summary: string[] = [];

  let totalBeforeDiscount = 0;
  for (const line of lines) {
    const lineTotal = line.unitPrice * line.quantity;
    summary.push(`${line.product}: $${lineTotal.toFixed(2)}`);
    totalBeforeDiscount += lineTotal;
  }

  const discountThreshold = 500;
  let discountApplied = false;
  if (totalBeforeDiscount > discountThreshold) {
    discountApplied = true;
  }
  const discount = discountApplied ? totalBeforeDiscount * 0.1 : 0;

  const tax = totalBeforeDiscount * taxRate;
  const finalTotal = totalBeforeDiscount - discount + tax;

  summary.push(`Subtotal: $${totalBeforeDiscount.toFixed(2)}`);
  summary.push(`Tax: $${tax.toFixed(2)}`);
  summary.push(`Total: $${finalTotal.toFixed(2)}`);

  return summary.join("\n");
}
```

## When to Use

- Variable declarations are far from where the variables are first used.
- Related statements are scattered across a function, separated by unrelated logic.
- You want to prepare code for Extract Function by grouping all statements that belong to one concern.
- Code review reveals that the reader has to jump back and forth to follow one line of logic.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

