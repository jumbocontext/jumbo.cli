---
name: refactoring-change-value-to-reference
description: Use when multiple objects hold copies of the same entity's data and updates must be visible everywhere, requiring a single shared canonical instance.
---

# Change Value to Reference

**Prompt:** Apply the "Change Value to Reference" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When you have multiple records that logically represent the same real-world entity, keeping them as independent value copies creates problems. If the shared data needs to be updated, you must find and update every copy; miss one and you have inconsistent data. By changing copies into references that point to a single canonical object, you ensure that updates happen in one place and all consumers see the same data. This is especially important when the shared entity has mutable state -- for example, a customer whose address can change, or a product whose price is updated. A repository or registry that hands out references to the same instance gives you a single source of truth and eliminates the synchronization burden.

## Mechanics

1. Create a repository (registry, store, or map) for the shared instances if one does not already exist.
2. Ensure the repository has a way to look up the canonical instance by a unique key.
3. Change the constructors of the host objects so that they look up the shared instance from the repository instead of creating a new copy.
4. Test to verify that all host objects now share the same instance.

## Example

### Before

```typescript
class Customer {
  readonly id: string;
  name: string;
  creditRating: number;

  constructor(id: string, name: string, creditRating: number) {
    this.id = id;
    this.name = name;
    this.creditRating = creditRating;
  }
}

class Order {
  private customer: Customer;
  private amount: number;

  constructor(customerId: string, customerName: string, creditRating: number, amount: number) {
    this.customer = new Customer(customerId, customerName, creditRating);
    this.amount = amount;
  }

  getCustomerName(): string {
    return this.customer.name;
  }

  getCustomerCreditRating(): number {
    return this.customer.creditRating;
  }
}

// Each order has its own copy of the customer
const order1 = new Order("C-881", "Priya Sharma", 720, 150);
const order2 = new Order("C-881", "Priya Sharma", 720, 300);
// Updating the customer's credit rating on order1 does NOT affect order2
```

### After

```typescript
class Customer {
  readonly id: string;
  name: string;
  creditRating: number;

  constructor(id: string, name: string, creditRating: number) {
    this.id = id;
    this.name = name;
    this.creditRating = creditRating;
  }
}

class CustomerRepository {
  private static customers: Map<string, Customer> = new Map();

  static register(customer: Customer): void {
    CustomerRepository.customers.set(customer.id, customer);
  }

  static find(id: string): Customer {
    const customer = CustomerRepository.customers.get(id);
    if (!customer) {
      throw new Error(`Customer not found: ${id}`);
    }
    return customer;
  }
}

class Order {
  private customer: Customer;
  private amount: number;

  constructor(customerId: string, amount: number) {
    this.customer = CustomerRepository.find(customerId);
    this.amount = amount;
  }

  getCustomerName(): string {
    return this.customer.name;
  }

  getCustomerCreditRating(): number {
    return this.customer.creditRating;
  }
}

// Register the canonical customer once
CustomerRepository.register(new Customer("C-881", "Priya Sharma", 720));

// Both orders reference the same customer instance
const order1 = new Order("C-881", 150);
const order2 = new Order("C-881", 300);

// Updating the customer's credit rating is reflected everywhere
CustomerRepository.find("C-881").creditRating = 750;
console.log(order1.getCustomerCreditRating()); // 750
console.log(order2.getCustomerCreditRating()); // 750
```

## When to Use

- Multiple objects contain copies of the same data and you need changes to be visible everywhere.
- The shared entity has mutable state that must stay consistent across all consumers.
- You are duplicating data across records and struggling to keep them in sync during updates.
- A clear unique key exists to identify the canonical instance (such as an ID or code).

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

