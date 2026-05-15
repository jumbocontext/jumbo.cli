import React from "react";
import { MemoryEntityScreen } from "./memory/MemoryEntityScreen.js";
import { PLACEHOLDER_INVARIANTS } from "./memory/MemoryPlaceholderData.js";

export function InvariantsScreen(): React.ReactElement {
  return (
    <MemoryEntityScreen
      entityType="invariant"
      title="Invariants"
      subtitle="Focused invariant memory list and selected invariant detail"
      rows={PLACEHOLDER_INVARIANTS}
    />
  );
}
