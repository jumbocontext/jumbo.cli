---
name: refactoring-split-loop
description: Use when a single loop computes multiple unrelated results, entangling concerns that should be independently understandable and extractable.
---

# Split Loop

**Prompt:** Apply the "Split Loop" refactoring to separate a loop that performs multiple tasks into individual loops, each responsible for a single task, enabling further extraction and simplification.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

A loop that computes multiple things at once forces you to understand all of those things whenever you need to modify one of them. Each task in the loop is entangled with the others, making it harder to extract any single computation into its own function. By splitting the loop so each copy handles only one task, you make each piece independently understandable and extractable. While splitting a loop may seem like a performance concern, in most cases the overhead of iterating twice is negligible compared to the clarity gained, and profiling can confirm this.

## Mechanics

1. Copy the loop.
2. Identify the side effects of the loop body and remove the ones that do not belong from each copy so that each loop performs only one task.
3. Test.
4. Consider applying Extract Function on each loop if it now has a clear, single purpose.

## Example

### Before

```typescript
interface Employee {
  name: string;
  department: string;
  salary: number;
  yearsOfService: number;
}

function generateReport(employees: Employee[]): {
  totalPayroll: number;
  longestTenure: Employee | null;
} {
  let totalPayroll = 0;
  let longestTenure: Employee | null = null;

  for (const emp of employees) {
    totalPayroll += emp.salary;

    if (longestTenure === null || emp.yearsOfService > longestTenure.yearsOfService) {
      longestTenure = emp;
    }
  }

  return { totalPayroll, longestTenure };
}
```

### After

```typescript
interface Employee {
  name: string;
  department: string;
  salary: number;
  yearsOfService: number;
}

function totalPayroll(employees: Employee[]): number {
  let total = 0;
  for (const emp of employees) {
    total += emp.salary;
  }
  return total;
}

function longestTenureEmployee(employees: Employee[]): Employee | null {
  let longest: Employee | null = null;
  for (const emp of employees) {
    if (longest === null || emp.yearsOfService > longest.yearsOfService) {
      longest = emp;
    }
  }
  return longest;
}

function generateReport(employees: Employee[]): {
  totalPayroll: number;
  longestTenure: Employee | null;
} {
  return {
    totalPayroll: totalPayroll(employees),
    longestTenure: longestTenureEmployee(employees),
  };
}
```

## When to Use

- A single loop accumulates multiple unrelated results (e.g., a sum and a maximum).
- You want to extract one of the loop's tasks into its own function but the entangled logic prevents it.
- Each task in the loop has different potential for optimization or replacement (e.g., one could become a pipeline).
- The loop body is long and hard to understand because it juggles several concerns at once.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

