---
name: refactoring-rename-variable
description: Use when a variable name is misleading, abbreviated, cryptic, or no longer matches what it actually holds.
---

# Rename Variable

**Prompt:** Apply the "Rename Variable" refactoring to give a variable a name that clearly communicates its purpose.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Good naming is the heart of clear programming. If a variable name is misleading, abbreviated, or vague, every reader has to mentally decode what it represents. Renaming a variable to something that accurately describes its role makes the code self-documenting.

## Mechanics

1. If the variable is widely used, consider applying Encapsulate Variable first
2. Find all references to the variable and change them to the new name
3. Test

## Example

### Before

```typescript
function summarize(accts: Account[]): void {
  let t = 0;
  let n = 0;
  for (const a of accts) {
    t += a.balance;
    n++;
  }
  console.log(`Count: ${n}, Total: ${t}, Average: ${t / n}`);
}
```

### After

```typescript
function summarize(accounts: Account[]): void {
  let totalBalance = 0;
  let accountCount = 0;
  for (const account of accounts) {
    totalBalance += account.balance;
    accountCount++;
  }
  console.log(`Count: ${accountCount}, Total: ${totalBalance}, Average: ${totalBalance / accountCount}`);
}
```

## When to Use

- A variable name is a single letter, abbreviation, or cryptic label
- The variable name no longer matches what it actually holds
- You have inherited code with poor naming conventions
- A code review reveals confusion about what a variable represents

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

