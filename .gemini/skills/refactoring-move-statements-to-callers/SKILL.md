---
name: refactoring-move-statements-to-callers
description: Use when callers of a shared function need divergent behavior for part of what it does, and the function has accumulated flags or conditionals to accommodate them.
---

# Move Statements to Callers

**Prompt:** Apply the "Move Statements to Callers" refactoring to extract behavior that varies per call site out of a shared function and into the individual callers.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Functions are the building blocks of abstraction, but boundaries shift as software evolves. Behavior that once was identical across all callers begins to diverge: some callers need a variation that others do not. When a shared function contains behavior that only some callers want, the function accumulates conditional logic or parameters that bloat its interface. Moving the diverging statements back to the callers restores the function to a clean, single-purpose abstraction and gives each caller the freedom to customize its own behavior.

## Mechanics

1. In simple cases with only one or two callers, cut the varying statement(s) from the function and paste them into each caller. Test and stop.
2. For more involved cases, use Extract Function to separate the statements that should remain in the function from those that should move.
3. Apply Inline Function on the original function to inline it into all callers.
4. Apply Extract Function again on the common code at each call site, giving the extracted function the original name.
5. Test.

## Example

### Before

```typescript
interface Invoice {
  customerName: string;
  items: Array<{ description: string; amount: number }>;
  dueDate: Date;
}

function renderInvoiceSummary(invoice: Invoice): string {
  const lines: string[] = [];
  lines.push(`Invoice for: ${invoice.customerName}`);
  const total = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  lines.push(`Total: $${total.toFixed(2)}`);
  lines.push(`Due: ${invoice.dueDate.toLocaleDateString()}`);
  lines.push(`Thank you for your business!`);
  return lines.join("\n");
}

// Email wants the "Thank you" footer
function sendInvoiceEmail(invoice: Invoice): void {
  const body = renderInvoiceSummary(invoice);
  sendEmail(invoice.customerName, "Invoice", body);
}

// PDF should NOT include the "Thank you" footer
function generateInvoicePdf(invoice: Invoice): void {
  const content = renderInvoiceSummary(invoice);
  writePdf("invoice.pdf", content);
}
```

### After

```typescript
interface Invoice {
  customerName: string;
  items: Array<{ description: string; amount: number }>;
  dueDate: Date;
}

function renderInvoiceSummary(invoice: Invoice): string {
  const lines: string[] = [];
  lines.push(`Invoice for: ${invoice.customerName}`);
  const total = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  lines.push(`Total: $${total.toFixed(2)}`);
  lines.push(`Due: ${invoice.dueDate.toLocaleDateString()}`);
  return lines.join("\n");
}

function sendInvoiceEmail(invoice: Invoice): void {
  let body = renderInvoiceSummary(invoice);
  body += "\nThank you for your business!";
  sendEmail(invoice.customerName, "Invoice", body);
}

function generateInvoicePdf(invoice: Invoice): void {
  const content = renderInvoiceSummary(invoice);
  writePdf("invoice.pdf", content);
}
```

## When to Use

- Different callers of a shared function need divergent behavior for part of what the function does.
- A function has grown conditional logic (flags, mode parameters) solely to accommodate varying caller needs.
- You want to simplify a function that has become too broad and restore it to a focused abstraction.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

