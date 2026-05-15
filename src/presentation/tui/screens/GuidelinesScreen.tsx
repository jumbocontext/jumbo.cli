import React from "react";
import { MemoryEntityScreen } from "./memory/MemoryEntityScreen.js";
import { PLACEHOLDER_GUIDELINES } from "./memory/MemoryPlaceholderData.js";

export function GuidelinesScreen(): React.ReactElement {
  return (
    <MemoryEntityScreen
      entityType="guideline"
      title="Guidelines"
      subtitle="Focused guideline memory list and selected guideline detail"
      rows={PLACEHOLDER_GUIDELINES}
    />
  );
}
