import React from "react";
import { MemoryEntityScreen } from "../entity-browser/MemoryEntityScreen.js";
import { useComponentsList } from "../../state-reading/TuiStateReader.js";
import type { ComponentView } from "../../../../application/context/components/ComponentView.js";

const COMPONENTS_SCREEN_COPY = {
  title: "Components",
  subtitle: "Focused component memory list and selected component detail",
} as const;

export function ComponentsScreen(): React.ReactElement {
  const componentsList = useComponentsList();

  return (
    <MemoryEntityScreen
      entityType="component"
      title={COMPONENTS_SCREEN_COPY.title}
      subtitle={COMPONENTS_SCREEN_COPY.subtitle}
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
