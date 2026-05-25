import React from "react";
import { Wizard } from "../../wizard/Wizard.js";
import type { WizardStepDefinition } from "../../wizard/Wizard.js";

export interface GuidelineAddValues {
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly rationale: string;
  readonly examples: string;
}

const GUIDELINE_ADD_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Classification",
    description: "Pick the category that frames this guideline.",
    fields: [
      {
        key: "category",
        label: "Category",
        placeholder: "e.g. codingStyle, testing, process",
      },
      {
        key: "title",
        label: "Title",
        placeholder: "e.g. Use export type for interface barrels",
      },
    ],
  },
  {
    title: "Description",
    description: "Describe the practice agents should follow.",
    fields: [
      {
        key: "description",
        label: "Description",
        placeholder: "e.g. Re-export interfaces with export type { ... }",
      },
    ],
  },
  {
    title: "Rationale",
    description: "Explain why this practice matters.",
    fields: [
      {
        key: "rationale",
        label: "Rationale",
        placeholder: "e.g. ESM validates named exports at runtime",
      },
    ],
  },
  {
    title: "Examples",
    description: "Provide concrete examples to clarify the practice.",
    fields: [
      {
        key: "examples",
        label: "Examples",
        placeholder: "e.g. export type { Foo } from './Foo.js';",
      },
    ],
  },
] as const;

interface GuidelineAddFlowProps {
  readonly onComplete: (values: Record<string, string>) => void;
  readonly onCancel: () => void;
}

export function GuidelineAddFlow({
  onComplete,
  onCancel,
}: GuidelineAddFlowProps): React.ReactElement {
  return (
    <Wizard
      title="Add Guideline"
      steps={GUIDELINE_ADD_STEPS}
      onConfirm={onComplete}
      onCancel={onCancel}
    />
  );
}
