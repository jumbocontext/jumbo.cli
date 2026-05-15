import React from "react";
import { MemoryEntityScreen } from "./memory/MemoryEntityScreen.js";
import { PLACEHOLDER_DECISIONS } from "./memory/MemoryPlaceholderData.js";

export function DecisionsScreen(): React.ReactElement {
  return (
    <MemoryEntityScreen
      entityType="decision"
      title="Decisions"
      subtitle="Focused decision memory list and selected decision detail"
      rows={PLACEHOLDER_DECISIONS}
    />
  );
}
