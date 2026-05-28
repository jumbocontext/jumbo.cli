import React from "react";
import { MemoryEntityScreen } from "../entity-browser/MemoryEntityScreen.js";
import { useGuidelinesList } from "../../state-reading/TuiStateReader.js";
import type { GuidelineView } from "../../../../application/context/guidelines/GuidelineView.js";

const GUIDELINES_SCREEN_COPY = {
  title: "Guidelines",
  subtitle: "Focused guideline memory list and selected guideline detail",
} as const;

export function GuidelinesScreen(): React.ReactElement {
  const guidelinesList = useGuidelinesList();

  return (
    <MemoryEntityScreen
      entityType="guideline"
      title={GUIDELINES_SCREEN_COPY.title}
      subtitle={GUIDELINES_SCREEN_COPY.subtitle}
      rows={(guidelinesList.data?.guidelines ?? []).map(toGuidelineEntityRow)}
      loading={guidelinesList.loading}
      error={guidelinesList.error}
    />
  );
}

function toGuidelineEntityRow(guideline: GuidelineView) {
  return {
    id: guideline.guidelineId,
    title: guideline.title,
    category: guideline.category,
    description: guideline.description,
    rationale: guideline.rationale,
    examples: guideline.examples,
  };
}
