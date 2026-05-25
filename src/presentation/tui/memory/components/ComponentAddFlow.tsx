import React from "react";
import { Wizard } from "../../wizard/Wizard.js";
import type { WizardStepDefinition } from "../../wizard/Wizard.js";

export interface ComponentAddValues {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly responsibility: string;
}

const COMPONENT_ADD_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Identity",
    description: "Name the component and classify its architectural role.",
    fields: [
      {
        key: "name",
        label: "Name",
        placeholder: "e.g. AddDecisionCommandHandler",
      },
      {
        key: "type",
        label: "Type",
        placeholder: "e.g. application",
      },
    ],
  },
  {
    title: "Description",
    description: "Describe what the component does at a high level.",
    fields: [
      {
        key: "description",
        label: "Description",
        placeholder: "e.g. Orchestrates decision creation",
      },
    ],
  },
  {
    title: "Responsibility",
    description: "State the single responsibility this component owns.",
    fields: [
      {
        key: "responsibility",
        label: "Responsibility",
        placeholder: "e.g. Invoke aggregate logic and persist events",
      },
    ],
  },
] as const;

interface ComponentAddFlowProps {
  readonly onComplete: (values: Record<string, string>) => void;
  readonly onCancel: () => void;
}

export function ComponentAddFlow({
  onComplete,
  onCancel,
}: ComponentAddFlowProps): React.ReactElement {
  return (
    <Wizard
      title="Add Component"
      steps={COMPONENT_ADD_STEPS}
      onConfirm={onComplete}
      onCancel={onCancel}
    />
  );
}
