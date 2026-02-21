---
name: refactoring-split-phase
description: Use when code mixes two distinct concerns (e.g., parsing and business logic) and splitting them into sequential phases with an intermediate data structure would simplify each.
---

# Split Phase

**Prompt:** Apply the "Split Phase" refactoring to separate code that handles two distinct concerns into sequential phases connected by an intermediate data structure.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When a block of code deals with two different things — for example parsing input and then applying business rules — it is harder to understand and modify because you have to keep both concerns in your head at once. Splitting the code into phases, each dealing with one concern, makes each phase simpler and the boundary between them explicit through an intermediate data structure.

## Mechanics

1. Extract the second-phase code into its own function
2. Introduce an intermediate data structure as an argument to the second-phase function
3. Examine each parameter of the second phase — if it is produced by the first phase, move it into the intermediate data structure
4. Apply Extract Function to the first phase and have it return the intermediate data structure
5. Test

## Example

### Before

```typescript
function processOrderFromCsv(csvLine: string, warehouseZip: string): string {
  const parts = csvLine.split(",");
  const productName = parts[0].trim();
  const quantity = parseInt(parts[1].trim(), 10);
  const unitPrice = parseFloat(parts[2].trim());
  const destinationZip = parts[3].trim();

  const subtotal = quantity * unitPrice;
  const isSameRegion = destinationZip.startsWith(warehouseZip.substring(0, 3));
  const shipping = isSameRegion ? subtotal * 0.05 : subtotal * 0.15;
  const total = subtotal + shipping;

  return `${productName}: $${total.toFixed(2)} (shipping: $${shipping.toFixed(2)})`;
}
```

### After

```typescript
interface OrderData {
  productName: string;
  quantity: number;
  unitPrice: number;
  destinationZip: string;
}

function parseOrder(csvLine: string): OrderData {
  const parts = csvLine.split(",");
  return {
    productName: parts[0].trim(),
    quantity: parseInt(parts[1].trim(), 10),
    unitPrice: parseFloat(parts[2].trim()),
    destinationZip: parts[3].trim(),
  };
}

function calculateOrderSummary(order: OrderData, warehouseZip: string): string {
  const subtotal = order.quantity * order.unitPrice;
  const isSameRegion = order.destinationZip.startsWith(warehouseZip.substring(0, 3));
  const shipping = isSameRegion ? subtotal * 0.05 : subtotal * 0.15;
  const total = subtotal + shipping;

  return `${order.productName}: $${total.toFixed(2)} (shipping: $${shipping.toFixed(2)})`;
}

function processOrderFromCsv(csvLine: string, warehouseZip: string): string {
  const order = parseOrder(csvLine);
  return calculateOrderSummary(order, warehouseZip);
}
```

## When to Use

- A function mixes input parsing with business logic
- A compiler-like process has distinct tokenizing, parsing, and evaluation stages
- You want to reuse one phase independently (e.g., swap CSV parsing for JSON parsing without changing business logic)

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

