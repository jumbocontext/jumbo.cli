import React from "react";
import { MemoryEntityScreen } from "../entity-browser/MemoryEntityScreen.js";
import { useGuidelinesList } from "../../state-reading/useGuidelinesList.js";
import type { GuidelineView } from "../../../../application/context/guidelines/GuidelineView.js";

const GUIDELINES_SCREEN_COPY = {
  title: "Guidelines",
  subtitle: "Focused guideline memory list and selected guideline detail",
} as const;

interface GuidelinesScreenProps {
  readonly shortcutsEnabled?: boolean;
}

export function GuidelinesScreen(
  { shortcutsEnabled = true }: GuidelinesScreenProps = {},
): React.ReactElement {
  const guidelinesList = useGuidelinesList();

  return (
    <MemoryEntityScreen
      entityType="guideline"
      title={GUIDELINES_SCREEN_COPY.title}
      subtitle={GUIDELINES_SCREEN_COPY.subtitle}
      rows={(guidelinesList.data?.guidelines ?? []).map(toGuidelineEntityRow)}
      loading={guidelinesList.loading}
      error={guidelinesList.error}
      shortcutsEnabled={shortcutsEnabled}
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
