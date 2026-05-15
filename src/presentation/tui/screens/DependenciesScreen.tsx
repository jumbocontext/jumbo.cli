import React from "react";
import { MemoryEntityScreen } from "./memory/MemoryEntityScreen.js";
import { PLACEHOLDER_DEPENDENCIES } from "./memory/MemoryPlaceholderData.js";

export function DependenciesScreen(): React.ReactElement {
  return (
    <MemoryEntityScreen
      entityType="dependency"
      title="Dependencies"
      subtitle="Focused dependency memory list and selected dependency detail"
      rows={PLACEHOLDER_DEPENDENCIES}
    />
  );
}
