import React from "react";
import { MemoryEntityScreen } from "../entity-browser/MemoryEntityScreen.js";
import { useInvariantsList } from "../../state-reading/useInvariantsList.js";
import type { InvariantView } from "../../../../application/context/invariants/InvariantView.js";

const INVARIANTS_SCREEN_COPY = {
  title: "Invariants",
  subtitle: "Focused invariant memory list and selected invariant detail",
} as const;

interface InvariantsScreenProps {
  readonly shortcutsEnabled?: boolean;
}

export function InvariantsScreen(
  { shortcutsEnabled = true }: InvariantsScreenProps = {},
): React.ReactElement {
  const invariantsList = useInvariantsList();

  return (
    <MemoryEntityScreen
      entityType="invariant"
      title={INVARIANTS_SCREEN_COPY.title}
      subtitle={INVARIANTS_SCREEN_COPY.subtitle}
      rows={(invariantsList.data?.invariants ?? []).map(toInvariantEntityRow)}
      loading={invariantsList.loading}
      error={invariantsList.error}
      shortcutsEnabled={shortcutsEnabled}
    />
  );
}

function toInvariantEntityRow(invariant: InvariantView) {
  return {
    id: invariant.invariantId,
    title: invariant.title,
    description: invariant.description,
    rationale: invariant.rationale ?? "",
  };
}
