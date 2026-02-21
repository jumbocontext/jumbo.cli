---
name: refactoring-combine-functions-into-transform
description: Use when multiple modules compute derived values from the same immutable source data and you want a single authoritative transform for all computed fields.
---

# Combine Functions into Transform

**Prompt:** Apply the "Combine Functions into Transform" refactoring to gather scattered derived-data calculations into a single enrichment function.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When multiple pieces of code derive values from the same source data, it is easy for those derivations to become scattered and inconsistent. A transform function takes the source data, computes all the derived values in one place, and returns an enriched copy of the data. This provides a single authoritative location for every derivation and makes it obvious what computed data is available.

## Mechanics

1. Create a transform function that accepts the source record and returns an enriched copy (deep clone to avoid mutating the original)
2. Pick one of the scattered derivations and move its logic into the transform, adding the result as a new field on the enriched record
3. Update callers to use the field from the enriched record instead of recalculating
4. Test
5. Repeat for each remaining derivation

## Example

### Before

```typescript
interface ConstructionEstimate {
  id: string;
  materialCost: number;
  laborHours: number;
  siteRisk: "low" | "high";
}

// scattered across different modules
function laborRate(siteRisk: ConstructionEstimate["siteRisk"]): number {
  return siteRisk === "high" ? 95 : 75;
}

function permitFee(materialCost: number): number {
  return materialCost > 50_000 ? 1500 : 800;
}

function laborCost(estimate: ConstructionEstimate): number {
  return estimate.laborHours * laborRate(estimate.siteRisk);
}

function subtotal(estimate: ConstructionEstimate): number {
  return estimate.materialCost + laborCost(estimate) + permitFee(estimate.materialCost);
}

function contingency(estimate: ConstructionEstimate): number {
  return estimate.siteRisk === "high" ? subtotal(estimate) * 0.12 : subtotal(estimate) * 0.06;
}

// in proposal.ts
const base = subtotal(estimate);

// in budgeting.ts (duplicated logic)
const total = subtotal(estimate) + contingency(estimate);
```

### After

```typescript
interface ConstructionEstimate {
  id: string;
  materialCost: number;
  laborHours: number;
  siteRisk: "low" | "high";
}

interface EnrichedEstimate extends ConstructionEstimate {
  laborCost: number;
  permitFee: number;
  subtotal: number;
  contingency: number;
  totalCost: number;
}

function enrichEstimate(estimate: ConstructionEstimate): EnrichedEstimate {
  const labor = estimate.laborHours * laborRate(estimate.siteRisk);
  const permit = permitFee(estimate.materialCost);
  const base = estimate.materialCost + labor + permit;
  const riskReserve = estimate.siteRisk === "high" ? base * 0.12 : base * 0.06;
  return {
    ...estimate,
    laborCost: labor,
    permitFee: permit,
    subtotal: base,
    contingency: riskReserve,
    totalCost: base + riskReserve,
  };
}

function laborRate(siteRisk: ConstructionEstimate["siteRisk"]): number {
  return siteRisk === "high" ? 95 : 75;
}

function permitFee(materialCost: number): number {
  return materialCost > 50_000 ? 1500 : 800;
}

// in proposal.ts
const enriched = enrichEstimate(estimate);
const base = enriched.subtotal;

// in budgeting.ts
const enrichedForBudget = enrichEstimate(estimate);
const total = enrichedForBudget.totalCost;
```

## When to Use

- Multiple modules compute derived values from the same source data
- You want a single authoritative source for all computed fields
- The source data is not mutated (use Combine Functions into Class if the data needs to change over its lifecycle)

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

