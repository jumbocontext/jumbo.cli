import React from "react";
import { MemoryEntityScreen } from "./memory/MemoryEntityScreen.js";
import { PLACEHOLDER_COMPONENTS } from "./memory/MemoryPlaceholderData.js";

export function ComponentsScreen(): React.ReactElement {
  return (
    <MemoryEntityScreen
      entityType="component"
      title="Components"
      subtitle="Focused component memory list and selected component detail"
      rows={PLACEHOLDER_COMPONENTS}
    />
  );
}
