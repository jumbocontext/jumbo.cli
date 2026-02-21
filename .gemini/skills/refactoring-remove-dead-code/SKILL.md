---
name: refactoring-remove-dead-code
description: Use when functions, variables, imports, or commented-out blocks are unused and adding cognitive load without contributing to the running system.
---

# Remove Dead Code

**Prompt:** Apply the "Remove Dead Code" refactoring to delete code that is no longer reachable or used, reducing noise and maintenance burden.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

Unused code is a persistent source of confusion. When reading a codebase, you cannot easily tell whether dead code is genuinely unused or if you simply have not found its caller yet. This forces developers to spend time understanding and maintaining code that has no effect on the running system. Commenting out code "just in case" is worse than deleting it, because version control already preserves history. Removing dead code reduces cognitive load, shrinks the surface area for bugs, and makes the remaining code easier to navigate.

## Mechanics

1. If the dead code can be referenced from outside (e.g., it is exported or part of a public API), check that no external consumers depend on it.
2. Remove the dead code.
3. Test.

Because version control preserves every deleted line, there is no risk in removal. If the code is ever needed again, it can be retrieved from history.

## Example

### Before

```typescript
interface Ticket {
  id: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  priority: number;
  assignee: string | null;
}

// This function is no longer called anywhere
function formatTicketForLegacyApi(ticket: Ticket): Record<string, string> {
  return {
    ticket_id: ticket.id,
    ticket_title: ticket.title,
    ticket_status: ticket.status.toUpperCase(),
    ticket_priority: String(ticket.priority),
    ticket_assignee: ticket.assignee ?? "UNASSIGNED",
  };
}

// Also unused -- was a helper for the legacy API integration
function batchFormatForLegacyApi(tickets: Ticket[]): Record<string, string>[] {
  return tickets.map(formatTicketForLegacyApi);
}

function getOpenTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) => t.status === "open");
}

function getHighPriorityTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) => t.priority >= 8);
}
```

### After

```typescript
interface Ticket {
  id: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  priority: number;
  assignee: string | null;
}

function getOpenTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) => t.status === "open");
}

function getHighPriorityTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) => t.priority >= 8);
}
```

## When to Use

- Static analysis, IDE warnings, or coverage tools report functions, variables, or imports that are never referenced.
- A feature has been removed but its supporting code was left behind.
- Commented-out code blocks have lingered in the codebase across multiple commits with no indication they will be restored.
- An entire module or class serves a deprecated integration that has been fully replaced.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

