---
name: refactoring-replace-loop-with-pipeline
description: Use when an imperative loop filters, transforms, or accumulates results and can be expressed more clearly as a collection pipeline (map, filter, reduce).
---

# Replace Loop with Pipeline

**Prompt:** Apply the "Replace Loop with Pipeline" refactoring to replace an imperative loop with a collection pipeline using operations like `map`, `filter`, and `reduce`, making the data transformation steps explicit and composable.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Imperative loops require the reader to mentally simulate each iteration, tracking mutations to accumulator variables and conditional branches, just to understand what data transformation is taking place. Collection pipelines express the same logic as a series of named operations -- filter these elements, transform each one, then accumulate a result -- making each step of the transformation visible and self-describing. Pipelines are easier to read, easier to modify (adding or removing a step is straightforward), and less prone to off-by-one or mutation errors.

## Mechanics

1. Create a new variable that holds the input collection.
2. Starting from the top of the loop body, take each piece of behavior and replace it with a pipeline operation (e.g., `filter` for conditions that skip iterations, `map` for transformations, `reduce` for accumulations).
3. After replacing each piece of loop behavior, test.
4. Once the entire loop body is replaced by pipeline operations, remove the loop.

## Example

### Before

```typescript
interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  isRefund: boolean;
}

function monthlySpendingByCategory(
  transactions: Transaction[],
  targetCategory: string
): { merchants: string[]; total: number } {
  const merchants: string[] = [];
  let total = 0;

  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    if (txn.isRefund) continue;
    if (txn.category !== targetCategory) continue;

    total += txn.amount;
    if (!merchants.includes(txn.merchant)) {
      merchants.push(txn.merchant);
    }
  }

  return { merchants, total };
}
```

### After

```typescript
interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  isRefund: boolean;
}

function monthlySpendingByCategory(
  transactions: Transaction[],
  targetCategory: string
): { merchants: string[]; total: number } {
  const relevant = transactions
    .filter((txn) => !txn.isRefund)
    .filter((txn) => txn.category === targetCategory);

  const total = relevant.reduce((sum, txn) => sum + txn.amount, 0);

  const merchants = [...new Set(relevant.map((txn) => txn.merchant))];

  return { merchants, total };
}
```

## When to Use

- A loop filters elements, transforms them, and/or accumulates a result -- all of which have direct pipeline equivalents.
- The loop body contains conditional `continue` or `break` statements that map cleanly to `filter`.
- Readability is more important than micro-optimization in the given context.
- You want to make each transformation step independently testable or reorderable.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

