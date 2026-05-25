import React from "react";
import { MemoryEntityScreen } from "../entity-browser/MemoryEntityScreen.js";
import { useComponentsList } from "../../state-reading/TuiStateReader.js";
import type { ComponentView } from "../../../../application/context/components/ComponentView.js";

export function ComponentsScreen(): React.ReactElement {
  const componentsList = useComponentsList();

  return (
    <MemoryEntityScreen
      entityType="component"
      title="Components"
      subtitle="Focused component memory list and selected component detail"
      rows={(componentsList.data?.components ?? []).map(toComponentEntityRow)}
      loading={componentsList.loading}
      error={componentsList.error}
    />
  );
}

function toComponentEntityRow(component: ComponentView) {
  return {
    id: component.componentId,
    name: component.name,
    type: component.type,
    description: component.description,
    responsibility: component.responsibility,
  };
}
