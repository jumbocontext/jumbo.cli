import React, { useMemo, useState } from "react";
import { Wizard } from "../wizard/Wizard.js";
import type { WizardStepDefinition } from "../wizard/Wizard.js";

type GoalAuthoringStage =
  | "details"
  | "criteria"
  | "scope"
  | "sequencing"
  | "workspace";

export interface GoalAuthoringValues {
  readonly title: string;
  readonly objective: string;
  readonly successCriteria: readonly string[];
  readonly scopeIn: string;
  readonly scopeOut: string;
  readonly nextGoal: string;
  readonly previousGoal: string;
  readonly prerequisiteGoals: string;
  readonly branch: string;
  readonly worktree: string;
}

const DETAILS_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Goal Details",
    description:
      "Name the goal and state the single outcome it should accomplish.",
    fields: [
      {
        key: "title",
        label: "Title",
        placeholder: "e.g. Wire Cockpit goal authoring",
      },
      {
        key: "objective",
        label: "Objective",
        placeholder: "e.g. Prototype the Goals screen",
      },
    ],
  },
] as const;

const SCOPE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Scope",
    description:
      "Identify the work area and boundaries that keep the goal focused.",
    fields: [
      {
        key: "scopeIn",
        label: "Scope in (optional)",
        placeholder: "e.g. src/presentation/tui/goals",
        required: false,
      },
      {
        key: "scopeOut",
        label: "Scope out (optional)",
        placeholder: "e.g. src/application",
        required: false,
      },
    ],
  },
] as const;

const SEQUENCING_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Goal Sequence",
    description:
      "Optionally chain this goal to other goals or define prerequisites.",
    fields: [
      {
        key: "previousGoal",
        label: "Previous goal (optional)",
        placeholder: "e.g. goal_123",
        required: false,
      },
      {
        key: "nextGoal",
        label: "Next goal (optional)",
        placeholder: "e.g. goal_456",
        required: false,
      },
      {
        key: "prerequisiteGoals",
        label: "Prerequisite goals (optional)",
        placeholder: "e.g. goal_a goal_b",
        required: false,
      },
    ],
  },
] as const;

const WORKSPACE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Workspace",
    description:
      "Optionally reserve a branch or worktree for multi-agent collaboration.",
    fields: [
      {
        key: "branch",
        label: "Branch (optional)",
        placeholder: "e.g. feature/cockpit-goal-authoring",
        required: false,
      },
      {
        key: "worktree",
        label: "Worktree (optional)",
        placeholder: "e.g. ../jumbo-cockpit-goal-authoring",
        required: false,
      },
    ],
  },
] as const;

const CRITERION_VALUES = {
  yes: "yes",
  no: "no",
} as const;
const AUTHORING_PROGRESS_LABELS: Readonly<Record<GoalAuthoringStage, string>> = {
  details: "1/5",
  criteria: "2/5",
  scope: "3/5",
  sequencing: "4/5",
  workspace: "5/5",
};

interface GoalAuthoringFlowProps {
  readonly onComplete: (values: GoalAuthoringValues) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly dispatchError?: string | null;
  readonly disabled?: boolean;
}

export function GoalAuthoringFlow({
  onComplete,
  onCancel,
  dispatchError = null,
  disabled = false,
}: GoalAuthoringFlowProps): React.ReactElement {
  const [stage, setStage] = useState<GoalAuthoringStage>("details");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [successCriteria, setSuccessCriteria] = useState<readonly string[]>([]);
  const [scopeValues, setScopeValues] = useState({
    scopeIn: "",
    scopeOut: "",
  });
  const [sequencingValues, setSequencingValues] = useState({
    previousGoal: "",
    nextGoal: "",
    prerequisiteGoals: "",
  });
  const [criteriaEditIndex, setCriteriaEditIndex] = useState(0);
  const [wizardKey, setWizardKey] = useState(0);
  const [workspaceValues, setWorkspaceValues] = useState({
    branch: "",
    worktree: "",
  });

  const criterionNumber = criteriaEditIndex + 1;
  const criteriaSteps = useMemo(
    () => buildCriteriaSteps(criterionNumber),
    [criterionNumber],
  );

  const handleDetailsConfirm = (values: Record<string, string>) => {
    setTitle(values.title ?? "");
    setObjective(values.objective ?? "");
    setCriteriaEditIndex(0);
    setStage("criteria");
  };

  const handleCriteriaConfirm = (values: Record<string, string>) => {
    const criterion = values.criterion ?? "";
    const nextSuccessCriteria = [...successCriteria];
    nextSuccessCriteria[criteriaEditIndex] = criterion;
    setSuccessCriteria(nextSuccessCriteria);

    if (values.addAnotherCriterion === CRITERION_VALUES.yes) {
      setCriteriaEditIndex(criteriaEditIndex + 1);
      setWizardKey((current) => current + 1);
      return;
    }

    setStage("scope");
  };

  const handleScopeConfirm = (values: Record<string, string>) => {
    setScopeValues({
      scopeIn: values.scopeIn ?? "",
      scopeOut: values.scopeOut ?? "",
    });
    setStage("sequencing");
  };

  const handleSequencingConfirm = (values: Record<string, string>) => {
    setSequencingValues({
      previousGoal: values.previousGoal ?? "",
      nextGoal: values.nextGoal ?? "",
      prerequisiteGoals: values.prerequisiteGoals ?? "",
    });
    setStage("workspace");
  };

  const handleWorkspaceConfirm = (values: Record<string, string>) => {
    const nextWorkspaceValues = {
      branch: values.branch ?? "",
      worktree: values.worktree ?? "",
    };
    setWorkspaceValues(nextWorkspaceValues);
    onComplete({
      title,
      objective,
      successCriteria,
      scopeIn: scopeValues.scopeIn,
      scopeOut: scopeValues.scopeOut,
      nextGoal: sequencingValues.nextGoal,
      previousGoal: sequencingValues.previousGoal,
      prerequisiteGoals: sequencingValues.prerequisiteGoals,
      branch: nextWorkspaceValues.branch,
      worktree: nextWorkspaceValues.worktree,
    });
  };

  const handleCriteriaBack = () => {
    if (criteriaEditIndex > 0) {
      setCriteriaEditIndex(criteriaEditIndex - 1);
      setWizardKey((current) => current + 1);
      return;
    }

    setStage("details");
  };

  const handleScopeBack = () => {
    setCriteriaEditIndex(Math.max(successCriteria.length - 1, 0));
    setStage("criteria");
  };

  const handleSequencingBack = () => {
    setStage("scope");
  };

  if (stage === "details") {
    return (
      <Wizard
        key="details"
        title="Author Goal"
        steps={DETAILS_STEPS}
        onConfirm={handleDetailsConfirm}
        onCancel={onCancel}
        initialValues={{ title, objective }}
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS.details}
      />
    );
  }

  if (stage === "criteria") {
    return (
      <Wizard
        key={`criteria-${wizardKey}`}
        title="Author Goal"
        steps={criteriaSteps}
        onConfirm={handleCriteriaConfirm}
        onCancel={onCancel}
        onBack={handleCriteriaBack}
        initialValues={{
          criterion: successCriteria[criteriaEditIndex] ?? "",
          addAnotherCriterion:
            criteriaEditIndex < successCriteria.length - 1
              ? CRITERION_VALUES.yes
              : CRITERION_VALUES.no,
        }}
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS.criteria}
      />
    );
  }

  if (stage === "scope") {
    return (
      <Wizard
        key="scope"
        title="Author Goal"
        steps={SCOPE_STEPS}
        onConfirm={handleScopeConfirm}
        onCancel={onCancel}
        onBack={handleScopeBack}
        initialValues={scopeValues}
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS.scope}
      />
    );
  }

  if (stage === "sequencing") {
    return (
      <Wizard
        key="sequencing"
        title="Author Goal"
        steps={SEQUENCING_STEPS}
        onConfirm={handleSequencingConfirm}
        onCancel={onCancel}
        onBack={handleSequencingBack}
        initialValues={sequencingValues}
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS.sequencing}
      />
    );
  }

  return (
    <Wizard
      key="workspace"
      title="Author Goal"
      steps={WORKSPACE_STEPS}
      onConfirm={handleWorkspaceConfirm}
      onCancel={onCancel}
      onBack={() => setStage("sequencing")}
      initialValues={workspaceValues}
      dispatchError={dispatchError}
      disabled={disabled}
      progressLabel={AUTHORING_PROGRESS_LABELS.workspace}
    />
  );
}

function buildCriteriaSteps(
  criterionNumber: number,
): readonly WizardStepDefinition[] {
  return [
    {
      title: `Criterion ${criterionNumber}`,
      description:
        "Define one measurable success criterion so review can determine completion.",
      fields: [
        {
          key: "criterion",
          label: "Success criterion",
          placeholder: "e.g. List renders status, detail, and action hints",
        },
        {
          key: "addAnotherCriterion",
          label: "Add another criterion?",
          kind: "yes-no",
          defaultValue: CRITERION_VALUES.no,
        },
      ],
    },
  ] as const;
}
