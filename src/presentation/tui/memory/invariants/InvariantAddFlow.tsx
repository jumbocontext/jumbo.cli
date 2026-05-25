import React from "react";
import { Wizard } from "../../wizard/Wizard.js";
import type { WizardStepDefinition } from "../../wizard/Wizard.js";

export interface InvariantAddValues {
  readonly title: string;
  readonly description: string;
  readonly rationale: string;
}

const INVARIANT_ADD_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Title",
    description: "Summarize the invariant in a single sentence.",
    fields: [
      {
        key: "title",
        label: "Title",
        placeholder: "e.g. One class per file",
      },
    ],
  },
  {
    title: "Description",
    description: "Describe the non-negotiable constraint in detail.",
    fields: [
      {
        key: "description",
        label: "Description",
        placeholder: "e.g. Each TS file contains exactly one class definition",
      },
    ],
  },
  {
    title: "Rationale",
    description: "Explain why this constraint cannot be violated.",
    fields: [
      {
        key: "rationale",
        label: "Rationale",
        placeholder: "e.g. Single-responsibility at the file level",
      },
    ],
  },
] as const;

interface InvariantAddFlowProps {
  readonly onComplete: (values: Record<string, string>) => void;
  readonly onCancel: () => void;
}

export function InvariantAddFlow({
  onComplete,
  onCancel,
}: InvariantAddFlowProps): React.ReactElement {
  return (
    <Wizard
      title="Add Invariant"
      steps={INVARIANT_ADD_STEPS}
      onConfirm={onComplete}
      onCancel={onCancel}
    />
  );
}
