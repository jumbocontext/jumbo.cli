# Event Storming Primitives — Design Notes

## Status: Under consideration

## Goal

Introduce event storming primitives (Role, Policy, Command, Event, Data) as first-class Jumbo knowledge entities, the same way Component, Decision, Invariant, and Guideline exist today.

## Naming Problem

Two of the five primitives collide with internal codebase concepts:

- **Command** collides with CQRS Command pattern (`AddComponentCommand`, `CommandHandler`, etc.)
- **Event** collides with domain events (`BaseEvent`, `ComponentAddedEvent`, etc.)

The collision affects directory names, class names, and domain event names. For example, `AddCommandCommand` or `CommandAddedEvent` (is that a Jumbo event or the user's registered event?).

### Constraint

User-facing CLI must use conventional event storming vocabulary: `jumbo command add`, `jumbo event add`. The disambiguation is internal only.

### Leading Option: Context-prefixed internals

| User-facing (CLI) | Internal name | Directory |
|---|---|---|
| `jumbo command add` | `ContextCommand` | `src/domain/context-commands/` |
| `jumbo event add` | `ContextEvent` | `src/domain/context-events/` |
| `jumbo role add` | `Role` | `src/domain/roles/` |
| `jumbo policy add` | `Policy` | `src/domain/policies/` |
| `jumbo model add` | `Model` | `src/domain/models/` |

Domain events: `ContextCommandAddedEvent`, `ContextEventAddedEvent`, `RoleAddedEvent`, `PolicyAddedEvent`, `ModelAddedEvent`. All unambiguous.

"Context" fits because Jumbo manages *context* — these are commands/events *in the user's context*, not commands/events *Jumbo executes*.

This naming exception must be documented as an invariant and must not be replicated for primitives without naming collisions.

### Rejected Options

- **Option A (prefixed internals)**: `DomainCommand`, `DomainEvent` — `DomainEvent` collides with the general concept
- **Option B (unconventional user language)**: `jumbo operation add`, `jumbo business-event add` — users should see canonical vocabulary
- **Storming-prefixed**: `StormCommand`, `StormEvent` — leaks methodology into the model
- **Operation/Outcome**: Internal mapping felt wrong in directory names (`src/domain/operations/`, `src/domain/outcomes/`)
- **Model as "Data" internal name**: "Model" is the user-facing term (`jumbo model add`), not an internal disambiguation

## Open Question: Everything is a Memory?

Recurring thought: all context primitives (Component, Decision, Invariant, Guideline, Role, Policy, Command, Event, Data) could be modeled as a single generic `Memory` aggregate with a discriminating `type` field and a generic `data` property. This would:

- Eliminate naming collisions entirely (Command and Event are just `Memory.type` values)
- Simplify the domain model dramatically
- Make adding new primitive types trivial (no new aggregate needed)

But it would:

- Make the domain model more ambiguous when working in the codebase
- Lose type-safe lifecycle modeling per primitive (each primitive has different valid state transitions)
- Lose domain-specific validation rules per primitive type
- Make the event store less expressive (all events become `MemoryAddedEvent` with type discrimination)

This idea needs more thought. It's a fundamental architectural pivot, not a naming fix.

## Lifecycle Depth (Per Primitive — TBD)

Each primitive needs its own lifecycle analysis. Not all need the full Component lifecycle (add/update/deprecate/undeprecate/remove/rename). To be determined case by case.

## Inter-Primitive Relations

Handled by the existing generic relation system, NOT by first-class typed relations. Rationale: event storming relationships are contextual, not rigid. A Role issues a Command, but so can a system. A Command doesn't produce Events — it precipitates them, but the Event is raised by a Component processing the Command. Forcing mappings between these entities would be incorrect. The relation system facilitates them without prescribing them.

## Invariants Registered

Six invariants were registered to govern the introduction of any new domain primitive:

1. **Domain events model primitive lifecycle** (`inv_1f298ec2`) — every state transition gets its own event type
2. **Every domain event projects to a read model** (`inv_e14d3f2e`) — EventHandler + Projector + EventWriter + migration
3. **CLI command per user-initiated lifecycle transition** (`inv_b3083140`) — Request → Controller → Gateway → CommandHandler chain
4. **New primitives join the relation system** (`inv_913694e8`) — add to EntityType enum
5. **System integration analysis for new primitives** (`inv_5b4f074c`) — explicit analysis of where primitive surfaces
6. **Primitive role surfaces contextually** (`inv_bb9a19fc`) — skills and outputs extended, not standalone docs
