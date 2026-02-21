---
name: refactoring-rename-field
description: Use when a field name is abbreviated, cryptic, or outdated and no longer matches the domain terminology the team uses.
---

# Rename Field

**Prompt:** Apply the "Rename Field" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Names are the most important tool for understanding what code does. Field names on record structures and classes are especially significant because they are referenced broadly across a codebase. A poorly named field forces every reader to mentally translate the name into the concept it actually represents. As understanding of a domain deepens, the original names chosen for data structures often become outdated or misleading. Renaming a field to match current understanding pays off every time someone reads or works with that data, reducing confusion and preventing bugs that arise from misinterpretation.

## Mechanics

1. If the record has limited scope, rename all accesses to the field and test. No further steps needed.
2. If the record is not already encapsulated, apply Encapsulate Record.
3. Rename the private field inside the object and update internal methods that reference it.
4. Update the constructor to accept the new name.
5. Update the accessor functions to use the new name.
6. Test.

## Example

### Before

```typescript
interface CustomerRecord {
  nm: string;
  addr: string;
  tel: string;
}

class Customer {
  private data: CustomerRecord;

  constructor(data: CustomerRecord) {
    this.data = data;
  }

  get nm(): string {
    return this.data.nm;
  }

  get addr(): string {
    return this.data.addr;
  }

  get tel(): string {
    return this.data.tel;
  }
}

const customer = new Customer({ nm: "Alice Trenton", addr: "42 Maple St", tel: "555-0199" });
console.log(customer.nm);
```

### After

```typescript
interface CustomerRecord {
  fullName: string;
  address: string;
  phoneNumber: string;
}

class Customer {
  private data: CustomerRecord;

  constructor(data: CustomerRecord) {
    this.data = data;
  }

  get fullName(): string {
    return this.data.fullName;
  }

  get address(): string {
    return this.data.address;
  }

  get phoneNumber(): string {
    return this.data.phoneNumber;
  }
}

const customer = new Customer({ fullName: "Alice Trenton", address: "42 Maple St", phoneNumber: "555-0199" });
console.log(customer.fullName);
```

## When to Use

- A field name is abbreviated or cryptic and forces readers to guess its meaning.
- Domain terminology has evolved and the existing name no longer matches how the team talks about the concept.
- A field name is misleading, suggesting it holds something different from what it actually contains.
- You are integrating with a new team or API and want field names to align with the shared vocabulary.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

