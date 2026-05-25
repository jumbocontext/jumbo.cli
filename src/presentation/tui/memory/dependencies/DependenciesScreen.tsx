import React from "react";
import { MemoryEntityScreen } from "../entity-browser/MemoryEntityScreen.js";
import { useDependenciesList } from "../../state-reading/TuiStateReader.js";
import type { DependencyView } from "../../../../application/context/dependencies/DependencyView.js";

export function DependenciesScreen(): React.ReactElement {
  const dependenciesList = useDependenciesList();

  return (
    <MemoryEntityScreen
      entityType="dependency"
      title="Dependencies"
      subtitle="Focused dependency memory list and selected dependency detail"
      rows={(dependenciesList.data?.dependencies ?? []).map(toDependencyEntityRow)}
      loading={dependenciesList.loading}
      error={dependenciesList.error}
    />
  );
}

function toDependencyEntityRow(dependency: DependencyView) {
  return {
    id: dependency.dependencyId,
    name: dependency.name,
    ecosystem: dependency.ecosystem,
    packageName: dependency.packageName,
    versionConstraint: dependency.versionConstraint ?? "",
    endpoint: dependency.endpoint ?? "",
    contract: dependency.contract ?? "",
  };
}
