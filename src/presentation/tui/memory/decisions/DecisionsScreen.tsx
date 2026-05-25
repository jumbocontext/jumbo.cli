import React from "react";
import { MemoryEntityScreen } from "../entity-browser/MemoryEntityScreen.js";
import { useDecisionsList } from "../../state-reading/TuiStateReader.js";
import type { DecisionView } from "../../../../application/context/decisions/DecisionView.js";

export function DecisionsScreen(): React.ReactElement {
  const decisionsList = useDecisionsList();

  return (
    <MemoryEntityScreen
      entityType="decision"
      title="Decisions"
      subtitle="Focused decision memory list and selected decision detail"
      rows={(decisionsList.data?.decisions ?? []).map(toDecisionEntityRow)}
      loading={decisionsList.loading}
      error={decisionsList.error}
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
