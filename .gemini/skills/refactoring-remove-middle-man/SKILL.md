---
name: refactoring-remove-middle-man
description: Use when a class has accumulated too many forwarding methods that simply delegate to another object, adding indirection without meaningful logic.
---

# Remove Middle Man

**Prompt:** Apply the "Remove Middle Man" refactoring to improve code structure and readability.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Remove Middle Man is the inverse of Hide Delegate. After applying Hide Delegate, you may find the server class accumulating more and more forwarding methods that do nothing but call through to a delegate. At that point the server becomes a hollow middle man, and every new feature on the delegate requires yet another pass-through method. It is simpler to let the client access the delegate directly and remove the forwarding clutter.

## Mechanics

1. Create a getter on the server that returns the delegate object.
2. For each delegating method on the server, update all clients to call the delegate directly.
3. Remove the delegating method from the server.
4. Repeat for each forwarding method that adds no value.
5. Test after each step.

## Example

### Before

```typescript
class Warehouse {
  private _location: string;
  private _capacity: number;

  constructor(location: string, capacity: number) {
    this._location = location;
    this._capacity = capacity;
  }

  get location(): string {
    return this._location;
  }

  get capacity(): number {
    return this._capacity;
  }
}

class Supplier {
  private _name: string;
  private _warehouse: Warehouse;

  constructor(name: string, warehouse: Warehouse) {
    this._name = name;
    this._warehouse = warehouse;
  }

  get name(): string {
    return this._name;
  }

  // Forwarding methods — middle man
  get warehouseLocation(): string {
    return this._warehouse.location;
  }

  get warehouseCapacity(): number {
    return this._warehouse.capacity;
  }
}

// Client
const supplier = new Supplier("Acme", new Warehouse("Denver", 50000));
console.log(supplier.warehouseLocation);
console.log(supplier.warehouseCapacity);
```

### After

```typescript
class Warehouse {
  private _location: string;
  private _capacity: number;

  constructor(location: string, capacity: number) {
    this._location = location;
    this._capacity = capacity;
  }

  get location(): string {
    return this._location;
  }

  get capacity(): number {
    return this._capacity;
  }
}

class Supplier {
  private _name: string;
  private _warehouse: Warehouse;

  constructor(name: string, warehouse: Warehouse) {
    this._name = name;
    this._warehouse = warehouse;
  }

  get name(): string {
    return this._name;
  }

  get warehouse(): Warehouse {
    return this._warehouse;
  }
}

// Client accesses delegate directly
const supplier = new Supplier("Acme", new Warehouse("Denver", 50000));
console.log(supplier.warehouse.location);
console.log(supplier.warehouse.capacity);
```

## When to Use

- The server class has many forwarding methods that simply delegate to another object.
- Every new feature on the delegate requires adding a matching pass-through on the server.
- The delegation adds indirection without meaningful logic, validation, or transformation.
- The delegate's interface is stable and unlikely to change frequently.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

