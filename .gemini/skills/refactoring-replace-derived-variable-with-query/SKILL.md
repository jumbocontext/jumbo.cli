---
name: refactoring-replace-derived-variable-with-query
description: Use when a stored variable is always derivable from other data, creating synchronization risk that a computed property or query would eliminate.
---

# Replace Derived Variable with Query

**Prompt:** Apply the "Replace Derived Variable with Query" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Mutable data is a frequent source of bugs because it can be modified in unexpected places and get out of sync with the data it was derived from. When a variable's value is always computable from other data, keeping it as a stored variable creates a maintenance burden: every code path that changes the source data must also remember to update the derived variable. Replacing the stored variable with a query (a computed property or function call) eliminates this entire class of synchronization bugs. The derived value is always correct by construction because it is recalculated on demand. The small performance cost is rarely significant and is a worthwhile trade for the increased reliability and clarity.

## Mechanics

1. Identify all points where the variable is updated.
2. Create a function that computes the value of the variable from the source data.
3. Use Introduce Assertion to assert that the variable and the computation produce the same result.
4. Test.
5. Replace all reads of the variable with calls to the new function.
6. Test.
7. Remove the declaration and assignments of the variable.

## Example

### Before

```typescript
class ShoppingCart {
  private items: { name: string; price: number; quantity: number }[] = [];
  private totalPrice: number = 0;
  private itemCount: number = 0;

  addItem(name: string, price: number, quantity: number): void {
    this.items.push({ name, price, quantity });
    this.totalPrice += price * quantity;
    this.itemCount += quantity;
  }

  removeItem(name: string): void {
    const index = this.items.findIndex(item => item.name === name);
    if (index !== -1) {
      const item = this.items[index];
      this.totalPrice -= item.price * item.quantity;
      this.itemCount -= item.quantity;
      this.items.splice(index, 1);
    }
  }

  getTotalPrice(): number {
    return this.totalPrice;
  }

  getItemCount(): number {
    return this.itemCount;
  }
}
```

### After

```typescript
class ShoppingCart {
  private items: { name: string; price: number; quantity: number }[] = [];

  addItem(name: string, price: number, quantity: number): void {
    this.items.push({ name, price, quantity });
  }

  removeItem(name: string): void {
    const index = this.items.findIndex(item => item.name === name);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  get totalPrice(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
```

## When to Use

- A variable is always derivable from other data in the same scope or object.
- Mutation of the source data and the derived variable must be kept in sync, creating a risk of bugs.
- The derived variable is updated in multiple places, making it hard to verify correctness.
- The computation is inexpensive enough that recalculating on each access is acceptable.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

