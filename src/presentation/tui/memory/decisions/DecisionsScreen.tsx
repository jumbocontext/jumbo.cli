import React from "react";
import { MemoryEntityScreen } from "../entity-browser/MemoryEntityScreen.js";
import { useDecisionsList } from "../../state-reading/useDecisionsList.js";
import type { DecisionView } from "../../../../application/context/decisions/DecisionView.js";

const DECISIONS_SCREEN_COPY = {
  title: "Decisions",
  subtitle: "Focused decision memory list and selected decision detail",
} as const;

interface DecisionsScreenProps {
  readonly shortcutsEnabled?: boolean;
}

export function DecisionsScreen(
  { shortcutsEnabled = true }: DecisionsScreenProps = {},
): React.ReactElement {
  const decisionsList = useDecisionsList();

  return (
    <MemoryEntityScreen
      entityType="decision"
      title={DECISIONS_SCREEN_COPY.title}
      subtitle={DECISIONS_SCREEN_COPY.subtitle}
      rows={(decisionsList.data?.decisions ?? []).map(toDecisionEntityRow)}
      loading={decisionsList.loading}
      error={decisionsList.error}
      shortcutsEnabled={shortcutsEnabled}
    />
  );
}

function toDecisionEntityRow(decision: DecisionView) {
  return {
    id: decision.decisionId,
    title: decision.title,
    context: decision.context,
    rationale: decision.rationale ?? "",
    alternatives: decision.alternatives,
    consequences: decision.consequences ?? "",
  };
}
