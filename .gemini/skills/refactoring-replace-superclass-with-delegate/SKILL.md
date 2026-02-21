---
name: refactoring-replace-superclass-with-delegate
description: Use when a class inherits primarily for code reuse rather than a true "is-a" relationship, exposing superclass methods that make no sense on the subclass.
---

# Replace Superclass with Delegate

**Prompt:** Apply the "Replace Superclass with Delegate" refactoring to replace an inheritance relationship where the subclass is not a true subtype with composition, delegating to the former superclass instead of extending it.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Sometimes a class inherits from another not because it truly "is-a" instance of that type, but because it wants to reuse some of its behavior. This misuse of inheritance breaks the Liskov Substitution Principle: callers who receive the subclass and treat it as the superclass may encounter surprising behavior or access methods that make no sense in context. Replacing the superclass with a delegate restores a clean "has-a" relationship. The class keeps the behavior it needs by forwarding specific calls to the delegate while hiding the parts that do not apply.

## Mechanics

1. Create a field in the subclass to hold a reference to an instance of the superclass (the delegate).
2. Initialize the delegate in the constructor, passing along any data the delegate needs.
3. For each superclass method that the subclass legitimately uses, create a forwarding method that calls the delegate.
4. Remove the `extends` clause from the subclass declaration.
5. Update any callers that relied on the subclass being assignable to the superclass type.
6. Test after each forwarding method is introduced.

## Example

### Before

```typescript
class HashMap<K, V> {
  private entries: Array<{ key: K; value: V }> = [];

  set(key: K, value: V): void {
    const existing = this.entries.find((e) => e.key === key);
    if (existing) {
      existing.value = value;
    } else {
      this.entries.push({ key, value });
    }
  }

  get(key: K): V | undefined {
    return this.entries.find((e) => e.key === key)?.value;
  }

  has(key: K): boolean {
    return this.entries.some((e) => e.key === key);
  }

  allEntries(): Array<{ key: K; value: V }> {
    return [...this.entries];
  }
}

// CategoryRegistry "is not really a" HashMap — it just wants lookup behavior.
// Inheriting exposes allEntries(), set(), and other raw map operations to callers.
class CategoryRegistry extends HashMap<string, string[]> {
  register(category: string, item: string): void {
    const current = this.get(category) ?? [];
    current.push(item);
    this.set(category, current);
  }

  itemsIn(category: string): readonly string[] {
    return this.get(category) ?? [];
  }
}
```

### After

```typescript
class HashMap<K, V> {
  private entries: Array<{ key: K; value: V }> = [];

  set(key: K, value: V): void {
    const existing = this.entries.find((e) => e.key === key);
    if (existing) {
      existing.value = value;
    } else {
      this.entries.push({ key, value });
    }
  }

  get(key: K): V | undefined {
    return this.entries.find((e) => e.key === key)?.value;
  }

  has(key: K): boolean {
    return this.entries.some((e) => e.key === key);
  }

  allEntries(): Array<{ key: K; value: V }> {
    return [...this.entries];
  }
}

class CategoryRegistry {
  private storage = new HashMap<string, string[]>();

  register(category: string, item: string): void {
    const current = this.storage.get(category) ?? [];
    current.push(item);
    this.storage.set(category, current);
  }

  itemsIn(category: string): readonly string[] {
    return this.storage.get(category) ?? [];
  }

  hasCategory(category: string): boolean {
    return this.storage.has(category);
  }
}

// CategoryRegistry now exposes only the operations that make sense for its purpose.
// Callers can no longer access raw map internals like allEntries() or set().
```

## When to Use

- A class extends another primarily for code reuse, not because it is a genuine subtype.
- The superclass exposes methods that do not make sense on the subclass, violating the Liskov Substitution Principle.
- You want to hide the internal implementation details and expose only a curated API.
- The "is-a" relationship feels forced and a "has-a" relationship better describes the design.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

