import React from "react";
import { Wizard } from "../../wizard/Wizard.js";
import type { WizardStepDefinition } from "../../wizard/Wizard.js";

export interface DependencyAddValues {
  readonly name: string;
  readonly ecosystem: string;
  readonly packageName: string;
  readonly versionConstraint: string;
  readonly endpoint: string;
  readonly contract: string;
}

const DEPENDENCY_ADD_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Identity",
    description: "Name and classify the external dependency.",
    fields: [
      {
        key: "name",
        label: "Name",
        placeholder: "e.g. TypeScript",
      },
      {
        key: "ecosystem",
        label: "Ecosystem",
        placeholder: "e.g. npm",
      },
    ],
  },
  {
    title: "Package",
    description: "Identify the package and pinned version constraint.",
    fields: [
      {
        key: "packageName",
        label: "Package name",
        placeholder: "e.g. typescript",
      },
      {
        key: "versionConstraint",
        label: "Version constraint",
        placeholder: "e.g. ^6.0.3",
      },
    ],
  },
  {
    title: "Contract",
    description: "Describe the endpoint or contract the dependency exposes.",
    fields: [
      {
        key: "endpoint",
        label: "Endpoint",
        placeholder: "e.g. https://api.example.com (or leave blank)",
      },
      {
        key: "contract",
        label: "Contract",
        placeholder: "e.g. Strict TypeScript compiler",
      },
    ],
  },
] as const;

interface DependencyAddFlowProps {
  readonly onComplete: (values: Record<string, string>) => void;
  readonly onCancel: () => void;
}

export function DependencyAddFlow({
  onComplete,
  onCancel,
}: DependencyAddFlowProps): React.ReactElement {
  return (
    <Wizard
      title="Add Dependency"
      steps={DEPENDENCY_ADD_STEPS}
      onConfirm={onComplete}
      onCancel={onCancel}
    />
  );
}
