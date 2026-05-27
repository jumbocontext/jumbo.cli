import React, { useMemo, useState } from "react";
import { Wizard } from "../wizard/Wizard.js";
import type { WizardStepDefinition } from "../wizard/Wizard.js";
import { WizardFieldKind } from "../wizard/WizardConstants.js";
import {
  AUTHORING_PROGRESS_LABELS,
  GoalAuthoringCopy,
  GoalAuthoringCriterionValue,
  GoalAuthoringFieldKey,
  GoalAuthoringStage,
  type GoalAuthoringStageValue,
} from "./GoalAuthoringFlowConstants.js";

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
    title: GoalAuthoringCopy.details.title,
    description: GoalAuthoringCopy.details.description,
    fields: [
      {
        key: GoalAuthoringFieldKey.TITLE,
        label: GoalAuthoringCopy.details.fields.title,
        placeholder: GoalAuthoringCopy.details.fields.titlePlaceholder,
      },
      {
        key: GoalAuthoringFieldKey.OBJECTIVE,
        label: GoalAuthoringCopy.details.fields.objective,
        placeholder: GoalAuthoringCopy.details.fields.objectivePlaceholder,
      },
    ],
  },
] as const;

const SCOPE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: GoalAuthoringCopy.scope.title,
    description: GoalAuthoringCopy.scope.description,
    fields: [
      {
        key: GoalAuthoringFieldKey.SCOPE_IN,
        label: GoalAuthoringCopy.scope.fields.scopeIn,
        placeholder: GoalAuthoringCopy.scope.fields.scopeInPlaceholder,
        required: false,
      },
      {
        key: GoalAuthoringFieldKey.SCOPE_OUT,
        label: GoalAuthoringCopy.scope.fields.scopeOut,
        placeholder: GoalAuthoringCopy.scope.fields.scopeOutPlaceholder,
        required: false,
      },
    ],
  },
] as const;

const SEQUENCING_STEPS: readonly WizardStepDefinition[] = [
  {
    title: GoalAuthoringCopy.sequencing.title,
    description: GoalAuthoringCopy.sequencing.description,
    fields: [
      {
        key: GoalAuthoringFieldKey.PREVIOUS_GOAL,
        label: GoalAuthoringCopy.sequencing.fields.previousGoal,
        placeholder:
          GoalAuthoringCopy.sequencing.fields.previousGoalPlaceholder,
        required: false,
      },
      {
        key: GoalAuthoringFieldKey.NEXT_GOAL,
        label: GoalAuthoringCopy.sequencing.fields.nextGoal,
        placeholder: GoalAuthoringCopy.sequencing.fields.nextGoalPlaceholder,
        required: false,
      },
      {
        key: GoalAuthoringFieldKey.PREREQUISITE_GOALS,
        label: GoalAuthoringCopy.sequencing.fields.prerequisiteGoals,
        placeholder:
          GoalAuthoringCopy.sequencing.fields.prerequisiteGoalsPlaceholder,
        required: false,
      },
    ],
  },
] as const;

const WORKSPACE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: GoalAuthoringCopy.workspace.title,
    description: GoalAuthoringCopy.workspace.description,
    fields: [
      {
        key: GoalAuthoringFieldKey.BRANCH,
        label: GoalAuthoringCopy.workspace.fields.branch,
        placeholder: GoalAuthoringCopy.workspace.fields.branchPlaceholder,
        required: false,
      },
      {
        key: GoalAuthoringFieldKey.WORKTREE,
        label: GoalAuthoringCopy.workspace.fields.worktree,
        placeholder: GoalAuthoringCopy.workspace.fields.worktreePlaceholder,
        required: false,
      },
    ],
  },
] as const;

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
  const [stage, setStage] = useState<GoalAuthoringStageValue>(
    GoalAuthoringStage.DETAILS,
  );
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
    setTitle(values[GoalAuthoringFieldKey.TITLE] ?? "");
    setObjective(values[GoalAuthoringFieldKey.OBJECTIVE] ?? "");
    setCriteriaEditIndex(0);
    setStage(GoalAuthoringStage.CRITERIA);
  };

  const handleCriteriaConfirm = (values: Record<string, string>) => {
    const criterion = values[GoalAuthoringFieldKey.CRITERION] ?? "";
    const nextSuccessCriteria = [...successCriteria];
    nextSuccessCriteria[criteriaEditIndex] = criterion;
    setSuccessCriteria(nextSuccessCriteria);

    if (
      values[GoalAuthoringFieldKey.ADD_ANOTHER_CRITERION] ===
      GoalAuthoringCriterionValue.YES
    ) {
      setCriteriaEditIndex(criteriaEditIndex + 1);
      setWizardKey((current) => current + 1);
      return;
    }

    setStage(GoalAuthoringStage.SCOPE);
  };

  const handleScopeConfirm = (values: Record<string, string>) => {
    setScopeValues({
      scopeIn: values[GoalAuthoringFieldKey.SCOPE_IN] ?? "",
      scopeOut: values[GoalAuthoringFieldKey.SCOPE_OUT] ?? "",
    });
    setStage(GoalAuthoringStage.SEQUENCING);
  };

  const handleSequencingConfirm = (values: Record<string, string>) => {
    setSequencingValues({
      previousGoal: values[GoalAuthoringFieldKey.PREVIOUS_GOAL] ?? "",
      nextGoal: values[GoalAuthoringFieldKey.NEXT_GOAL] ?? "",
      prerequisiteGoals:
        values[GoalAuthoringFieldKey.PREREQUISITE_GOALS] ?? "",
    });
    setStage(GoalAuthoringStage.WORKSPACE);
  };

  const handleWorkspaceConfirm = (values: Record<string, string>) => {
    const nextWorkspaceValues = {
      branch: values[GoalAuthoringFieldKey.BRANCH] ?? "",
      worktree: values[GoalAuthoringFieldKey.WORKTREE] ?? "",
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

    setStage(GoalAuthoringStage.DETAILS);
  };

  const handleScopeBack = () => {
    setCriteriaEditIndex(Math.max(successCriteria.length - 1, 0));
    setStage(GoalAuthoringStage.CRITERIA);
  };

  const handleSequencingBack = () => {
    setStage(GoalAuthoringStage.SCOPE);
  };

  if (stage === GoalAuthoringStage.DETAILS) {
    return (
      <Wizard
        key={GoalAuthoringStage.DETAILS}
        title={GoalAuthoringCopy.title}
        steps={DETAILS_STEPS}
        onConfirm={handleDetailsConfirm}
        onCancel={onCancel}
        initialValues={{ title, objective }}
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.DETAILS]}
      />
    );
  }

  if (stage === GoalAuthoringStage.CRITERIA) {
    return (
      <Wizard
        key={`criteria-${wizardKey}`}
        title={GoalAuthoringCopy.title}
        steps={criteriaSteps}
        onConfirm={handleCriteriaConfirm}
        onCancel={onCancel}
        onBack={handleCriteriaBack}
        initialValues={{
          [GoalAuthoringFieldKey.CRITERION]:
            successCriteria[criteriaEditIndex] ?? "",
          [GoalAuthoringFieldKey.ADD_ANOTHER_CRITERION]:
            criteriaEditIndex < successCriteria.length - 1
              ? GoalAuthoringCriterionValue.YES
              : GoalAuthoringCriterionValue.NO,
        }}
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.CRITERIA]}
      />
    );
  }

  if (stage === GoalAuthoringStage.SCOPE) {
    return (
      <Wizard
        key={GoalAuthoringStage.SCOPE}
        title={GoalAuthoringCopy.title}
        steps={SCOPE_STEPS}
        onConfirm={handleScopeConfirm}
        onCancel={onCancel}
        onBack={handleScopeBack}
        initialValues={scopeValues}
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.SCOPE]}
      />
    );
  }

  if (stage === GoalAuthoringStage.SEQUENCING) {
    return (
      <Wizard
        key={GoalAuthoringStage.SEQUENCING}
        title={GoalAuthoringCopy.title}
        steps={SEQUENCING_STEPS}
        onConfirm={handleSequencingConfirm}
        onCancel={onCancel}
        onBack={handleSequencingBack}
        initialValues={sequencingValues}
        dispatchError={dispatchError}
        disabled={disabled}
        progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.SEQUENCING]}
      />
    );
  }

  return (
    <Wizard
      key={GoalAuthoringStage.WORKSPACE}
      title={GoalAuthoringCopy.title}
      steps={WORKSPACE_STEPS}
      onConfirm={handleWorkspaceConfirm}
      onCancel={onCancel}
      onBack={() => setStage(GoalAuthoringStage.SEQUENCING)}
      initialValues={workspaceValues}
      dispatchError={dispatchError}
      disabled={disabled}
      progressLabel={AUTHORING_PROGRESS_LABELS[GoalAuthoringStage.WORKSPACE]}
    />
  );
}

function buildCriteriaSteps(
  criterionNumber: number,
): readonly WizardStepDefinition[] {
  return [
    {
      title: `${GoalAuthoringCopy.criteria.titlePrefix} ${criterionNumber}`,
      description: GoalAuthoringCopy.criteria.description,
      fields: [
        {
          key: GoalAuthoringFieldKey.CRITERION,
          label: GoalAuthoringCopy.criteria.successCriterion,
          placeholder: GoalAuthoringCopy.criteria.successCriterionPlaceholder,
        },
        {
          key: GoalAuthoringFieldKey.ADD_ANOTHER_CRITERION,
          label: GoalAuthoringCopy.criteria.addAnotherCriterion,
          kind: WizardFieldKind.YES_NO,
          defaultValue: GoalAuthoringCriterionValue.NO,
        },
      ],
    },
  ] as const;
}
