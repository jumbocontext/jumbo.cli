import React from "react";
import { Wizard } from "../../wizard/Wizard.js";
import type { WizardStepDefinition } from "../../wizard/Wizard.js";

export interface DecisionAddValues {
  readonly title: string;
  readonly context: string;
  readonly rationale: string;
  readonly alternatives: string;
  readonly consequences: string;
}

const DECISION_ADD_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Title",
    description: "Summarize the decision in a single sentence.",
    fields: [
      {
        key: "title",
        label: "Title",
        placeholder: "e.g. Use Node16 module resolution",
      },
    ],
  },
  {
    title: "Context",
    description: "Capture the situation that prompted this decision.",
    fields: [
      {
        key: "context",
        label: "Context",
        placeholder: "e.g. ESM migration required a stable resolver",
      },
    ],
  },
  {
    title: "Rationale",
    description: "Explain why this option was chosen over alternatives.",
    fields: [
      {
        key: "rationale",
        label: "Rationale",
        placeholder: "e.g. Equivalent to NodeNext but non-experimental",
      },
    ],
  },
  {
    title: "Alternatives",
    description: "List rejected alternatives so future readers understand tradeoffs.",
    fields: [
      {
        key: "alternatives",
        label: "Alternatives",
        placeholder: "e.g. NodeNext, Classic",
      },
    ],
  },
  {
    title: "Consequences",
    description: "Identify the lasting impact of this decision.",
    fields: [
      {
        key: "consequences",
        label: "Consequences",
        placeholder: "e.g. Locked into Node16-style relative imports",
      },
    ],
  },
] as const;

interface DecisionAddFlowProps {
  readonly onComplete: (values: Record<string, string>) => void;
  readonly onCancel: () => void;
}

export function DecisionAddFlow({
  onComplete,
  onCancel,
}: DecisionAddFlowProps): React.ReactElement {
  return (
    <Wizard
      title="Add Decision"
      steps={DECISION_ADD_STEPS}
      onConfirm={onComplete}
      onCancel={onCancel}
    />
  );
}
