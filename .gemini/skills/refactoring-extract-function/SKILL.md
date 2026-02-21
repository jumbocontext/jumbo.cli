---
name: refactoring-extract-function
description: Use when a code block needs a comment to explain what it does, a function is doing too many things, or you want to isolate logic for reuse or testing.
---

# Extract Function

**Prompt:** Apply the "Extract Function" refactoring to improve code structure by turning a code fragment into a well-named function.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When you see a block of code that requires a comment to explain what it does, or a function that is doing too many things, that is a signal to extract the fragment into its own function. A well-named function communicates intent without requiring the reader to parse the implementation details. The key insight is: if you have to spend effort looking at a fragment of code to figure out *what* it does, extract it and name the function after that "what."

## Mechanics

1. Create a new function and name it after the *intent* of the code (what it does, not how it does it)
2. Copy the extracted code from the source function into the new function
3. Scan the extracted code for references to variables that are local to the source function — these become parameters and local variables of the new function
4. Check whether any temporary variables are used only within the extracted code — if so, declare them as local variables in the new function
5. Look for any variables in the extracted code that are modified — if a modified variable is used after the extraction, have the new function return it
6. Replace the extracted code in the source function with a call to the new function

## Example

### Before

```typescript
function printInvoice(invoice: Invoice): void {
  console.log("=============================");
  console.log("=== Customer Invoice ========");
  console.log("=============================");

  // calculate outstanding balance
  let outstanding = 0;
  for (const shipment of invoice.shipments) {
    outstanding += shipment.quantity * shipment.pricePerUnit;
  }

  // print header
  console.log(`Customer: ${invoice.customerName}`);
  console.log(`Total shipments: ${invoice.shipments.length}`);

  // print details
  for (const shipment of invoice.shipments) {
    console.log(`  ${shipment.description}: ${shipment.quantity} x $${shipment.pricePerUnit}`);
  }

  console.log(`Outstanding balance: $${outstanding.toFixed(2)}`);
}
```

### After

```typescript
function printInvoice(invoice: Invoice): void {
  printBanner();
  const outstanding = calculateOutstanding(invoice.shipments);
  printHeader(invoice);
  printShipmentDetails(invoice.shipments);
  console.log(`Outstanding balance: $${outstanding.toFixed(2)}`);
}

function printBanner(): void {
  console.log("=============================");
  console.log("=== Customer Invoice ========");
  console.log("=============================");
}

function calculateOutstanding(shipments: Shipment[]): number {
  let total = 0;
  for (const shipment of shipments) {
    total += shipment.quantity * shipment.pricePerUnit;
  }
  return total;
}

function printHeader(invoice: Invoice): void {
  console.log(`Customer: ${invoice.customerName}`);
  console.log(`Total shipments: ${invoice.shipments.length}`);
}

function printShipmentDetails(shipments: Shipment[]): void {
  for (const shipment of shipments) {
    console.log(`  ${shipment.description}: ${shipment.quantity} x $${shipment.pricePerUnit}`);
  }
}
```

## When to Use

- A function is doing more than one thing
- You need to write a comment to explain what a block of code does
- A block of code is reused in multiple places
- You want to isolate a piece of logic for easier testing

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

