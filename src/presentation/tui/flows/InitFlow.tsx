import React, { useMemo, useState } from "react";
import { Box, Text } from "ink";
import { Wizard } from "../components/Wizard.js";
import type { WizardStepDefinition } from "../components/Wizard.js";
import { dispatchTuiAction } from "../actions/TuiActionDispatcher.js";
import type { TuiRequestController } from "../actions/TuiActionDispatcher.js";
import type { PlanProjectInitRequest } from "../../../application/context/project/init/PlanProjectInitRequest.js";
import type { PlanProjectInitResponse } from "../../../application/context/project/init/PlanProjectInitResponse.js";
import type { InitializeProjectRequest } from "../../../application/context/project/init/InitializeProjectRequest.js";
import type { InitializeProjectResponse } from "../../../application/context/project/init/InitializeProjectResponse.js";
import type { AddAudienceRequest } from "../../../application/context/audiences/add/AddAudienceRequest.js";
import type { AddAudienceResponse } from "../../../application/context/audiences/add/AddAudienceResponse.js";
import type { AddValuePropositionRequest } from "../../../application/context/value-propositions/add/AddValuePropositionRequest.js";
import type { AddValuePropositionResponse } from "../../../application/context/value-propositions/add/AddValuePropositionResponse.js";
import type { AgentId } from "../../../application/context/project/init/AgentSelection.js";
import type { PlannedFileChange } from "../../../application/context/project/init/PlannedFileChange.js";
import { SemanticColors } from "../../shared/DesignTokens.js";

const YES_NO_MESSAGE = "Enter yes or no";
const REQUIRED_PLAN_CONTROLLER_ERROR =
  "Project initialization planning is unavailable. Restart Jumbo and try again.";
const REQUIRED_INIT_CONTROLLER_ERROR =
  "Project initialization is unavailable. Restart Jumbo and try again.";
const REQUIRED_AUDIENCE_CONTROLLER_ERROR =
  "Audience registration is unavailable. Restart Jumbo and try again.";
const REQUIRED_VALUE_PROPOSITION_CONTROLLER_ERROR =
  "Value proposition registration is unavailable. Restart Jumbo and try again.";

type InitFlowStage =
  | "project"
  | "audience-gate"
  | "audience"
  | "value-gate"
  | "value"
  | "agent-selection"
  | "confirmation"
  | "success";

const INIT_FLOW_STAGES_WITH_AGENT_SELECTION: readonly InitFlowStage[] = [
  "project",
  "audience-gate",
  "audience",
  "value-gate",
  "value",
  "agent-selection",
  "confirmation",
] as const;

const INIT_FLOW_STAGES_WITHOUT_AGENT_SELECTION: readonly InitFlowStage[] = [
  "project",
  "audience-gate",
  "audience",
  "value-gate",
  "value",
  "confirmation",
] as const;

interface ProjectDetails {
  readonly name: string;
  readonly purpose: string | undefined;
}

export interface InitFlowActionControllers {
  readonly planProjectInitController?: TuiRequestController<
    PlanProjectInitRequest,
    PlanProjectInitResponse
  >;
  readonly initializeProjectController?: TuiRequestController<
    InitializeProjectRequest,
    InitializeProjectResponse
  >;
  readonly addAudienceController?: TuiRequestController<
    AddAudienceRequest,
    AddAudienceResponse
  >;
  readonly addValuePropositionController?: TuiRequestController<
    AddValuePropositionRequest,
    AddValuePropositionResponse
  >;
}

interface InitFlowProps {
  readonly actionControllers?: InitFlowActionControllers;
  readonly onComplete: (values: Record<string, string>) => void | Promise<void>;
  readonly onCancel: () => void;
}

const PROJECT_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Project Name",
    description:
      "What is your project called? This name will appear in context packets served to coding agents.",
    fields: [
      {
        key: "projectName",
        label: "Project name",
        placeholder: "e.g. Jumbo",
      },
    ],
  },
  {
    title: "Purpose",
    description:
      "Describe the purpose of your project. What problem does it solve? This helps agents understand the north-star.",
    fields: [
      {
        key: "purpose",
        label: "Project purpose",
        placeholder: "e.g. Context management for LLM coding agents",
        required: false,
      },
    ],
  },
] as const;

const AUDIENCE_GATE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Audiences",
    description:
      "Who are the primary audiences for your project? Understanding your users helps agents make better decisions.",
    fields: [
      {
        key: "addAudience",
        label: "Add an audience?",
        kind: "yes-no",
        defaultValue: "no",
        required: false,
        validate: validateOptionalYesNo,
      },
    ],
  },
] as const;

const AUDIENCE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Audiences",
    description:
      "Who are the primary audiences for your project? Understanding your users helps agents make better decisions.",
    fields: [
      {
        key: "audienceName",
        label: "Audience name",
        placeholder: "e.g. Software Developers",
      },
      {
        key: "audienceDescription",
        label: "Audience description",
        placeholder: "e.g. Developers collaborating with LLM coding agents",
      },
      {
        key: "audiencePriority",
        label: "Audience priority",
        placeholder: "primary, secondary, or tertiary",
        validate: validateAudiencePriority,
      },
      {
        key: "addAnotherAudience",
        label: "Add another audience?",
        kind: "yes-no",
        defaultValue: "no",
        required: false,
        validate: validateOptionalYesNo,
      },
    ],
  },
] as const;

const VALUE_GATE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Value Propositions",
    description:
      "What value does your project deliver? These propositions guide what capabilities matter most.",
    fields: [
      {
        key: "addValueProposition",
        label: "Add a value proposition?",
        kind: "yes-no",
        defaultValue: "no",
        required: false,
        validate: validateOptionalYesNo,
      },
    ],
  },
] as const;

const VALUE_STEPS: readonly WizardStepDefinition[] = [
  {
    title: "Value Propositions",
    description:
      "What value does your project deliver? These propositions guide what capabilities matter most.",
    fields: [
      {
        key: "valueTitle",
        label: "Value proposition title",
        placeholder: "e.g. Persistent context across sessions",
      },
      {
        key: "valueDescription",
        label: "Description",
        placeholder: "e.g. Detailed explanation of the value",
      },
      {
        key: "valueBenefit",
        label: "Benefit",
        placeholder: "e.g. Agents never lose important project context",
      },
      {
        key: "valueMeasurableOutcome",
        label: "Measurable outcome",
        placeholder: "optional",
        required: false,
      },
      {
        key: "addAnotherValueProposition",
        label: "Add another value proposition?",
        kind: "yes-no",
        defaultValue: "no",
        required: false,
        validate: validateOptionalYesNo,
      },
    ],
  },
] as const;

export function InitFlow({
  actionControllers = {},
  onComplete,
  onCancel,
}: InitFlowProps): React.ReactElement {
  const [stage, setStage] = useState<InitFlowStage>("project");
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null,
  );
  const [audiences, setAudiences] = useState<AddAudienceRequest[]>([]);
  const [valuePropositions, setValuePropositions] = useState<
    AddValuePropositionRequest[]
  >([]);
  const [planResponse, setPlanResponse] =
    useState<PlanProjectInitResponse | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<
    readonly AgentId[] | undefined
  >(undefined);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  const agentSelectionSteps = useMemo(
    () => buildAgentSelectionSteps(planResponse),
    [planResponse],
  );
  const confirmationSteps = useMemo(
    () => buildConfirmationSteps(planResponse?.plannedChanges ?? []),
    [planResponse],
  );

  const resetWizard = () => setWizardKey((current) => current + 1);

  const handleProjectConfirm = async (values: Record<string, string>) => {
    const nextProjectDetails = {
      name: values.projectName.trim(),
      purpose: (values.purpose ?? "").trim() || undefined,
    };
    setProjectDetails(nextProjectDetails);
    setStage("audience-gate");
    resetWizard();
  };

  const handleAudienceGateConfirm = (values: Record<string, string>) => {
    if (isYes(values.addAudience ?? "")) {
      setStage("audience");
    } else {
      setStage("value-gate");
    }
    resetWizard();
  };

  const handleAudienceConfirm = (values: Record<string, string>) => {
    setAudiences((current) => [
      ...current,
      {
        name: values.audienceName.trim(),
        description: values.audienceDescription.trim(),
        priority: toAudiencePriority(values.audiencePriority),
      },
    ]);
    setStage(isYes(values.addAnotherAudience ?? "") ? "audience" : "value-gate");
    resetWizard();
  };

  const handleValueGateConfirm = async (values: Record<string, string>) => {
    if (isYes(values.addValueProposition ?? "")) {
      setStage("value");
      resetWizard();
      return;
    }

    await planProjectInit(undefined);
  };

  const handleValueConfirm = async (values: Record<string, string>) => {
    const nextValuePropositions = [
      ...valuePropositions,
      {
        title: values.valueTitle.trim(),
        description: values.valueDescription.trim(),
        benefit: values.valueBenefit.trim(),
        measurableOutcome:
          (values.valueMeasurableOutcome ?? "").trim().length === 0
            ? undefined
            : values.valueMeasurableOutcome.trim(),
      },
    ];
    setValuePropositions(nextValuePropositions);

    if (isYes(values.addAnotherValueProposition ?? "")) {
      setStage("value");
      resetWizard();
      return;
    }

    await planProjectInit(undefined);
  };

  const handleAgentSelectionConfirm = async (values: Record<string, string>) => {
    const parsedAgentIds = parseAgentSelection(
      values.selectedAgentIds ?? "",
    );
    setSelectedAgentIds(parsedAgentIds);
    await planProjectInit(parsedAgentIds);
  };

  const handleConfirmationConfirm = async (values: Record<string, string>) => {
    if (isExplicitNo(values.confirmInitialization ?? "")) {
      onCancel();
      return;
    }

    await initializeProject();
  };

  const planProjectInit = async (
    nextSelectedAgentIds: readonly AgentId[] | undefined,
  ) => {
    const controller = actionControllers.planProjectInitController;
    if (controller === undefined) {
      setDispatchError(REQUIRED_PLAN_CONTROLLER_ERROR);
      return;
    }

    setWorking(true);
    setDispatchError(null);
    const result = await dispatchTuiAction(controller, {
      projectRoot: process.cwd(),
      selectedAgentIds: nextSelectedAgentIds,
    });
    setWorking(false);

    if (!result.ok) {
      setDispatchError(result.error.message);
      return;
    }

    setPlanResponse(result.response);
    if (
      nextSelectedAgentIds === undefined &&
      result.response.availableAgents.length > 0
    ) {
      setStage("agent-selection");
    } else {
      setStage("confirmation");
    }
    resetWizard();
  };

  const initializeProject = async () => {
    if (projectDetails === null) {
      setDispatchError("Project details are required before initialization.");
      return;
    }
    const initializeController = actionControllers.initializeProjectController;
    if (initializeController === undefined) {
      setDispatchError(REQUIRED_INIT_CONTROLLER_ERROR);
      return;
    }

    setWorking(true);
    setDispatchError(null);
    const initResult = await dispatchTuiAction(initializeController, {
      name: projectDetails.name,
      purpose: projectDetails.purpose,
      projectRoot: process.cwd(),
      selectedAgentIds,
    });

    if (!initResult.ok) {
      setWorking(false);
      setDispatchError(initResult.error.message);
      return;
    }

    const primitiveResult = await persistCollectedPrimitives(
      actionControllers,
      audiences,
      valuePropositions,
    );
    setWorking(false);

    if (!primitiveResult.ok) {
      setDispatchError(primitiveResult.error.message);
      return;
    }

    setStage("success");
    await onComplete({
      ...flattenCollectedValues(projectDetails, audiences, valuePropositions),
      projectId: initResult.response.projectId,
    });
  };

  if (stage === "success") {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={SemanticColors.success} bold>
          Project initialized successfully.
        </Text>
      </Box>
    );
  }

  return (
    <Wizard
      key={`${stage}-${wizardKey}`}
      title="Initialize Project"
      steps={resolveSteps(stage, agentSelectionSteps, confirmationSteps)}
      onConfirm={resolveConfirmHandler(stage, {
        handleProjectConfirm,
        handleAudienceGateConfirm,
        handleAudienceConfirm,
        handleValueGateConfirm,
        handleValueConfirm,
        handleAgentSelectionConfirm,
        handleConfirmationConfirm,
      })}
      onCancel={onCancel}
      dispatchError={dispatchError}
      disabled={working}
      progressLabel={resolveProgressLabel(stage, planResponse)}
    />
  );
}

function resolveSteps(
  stage: InitFlowStage,
  agentSelectionSteps: readonly WizardStepDefinition[],
  confirmationSteps: readonly WizardStepDefinition[],
): readonly WizardStepDefinition[] {
  if (stage === "project") return PROJECT_STEPS;
  if (stage === "audience-gate") return AUDIENCE_GATE_STEPS;
  if (stage === "audience") return AUDIENCE_STEPS;
  if (stage === "value-gate") return VALUE_GATE_STEPS;
  if (stage === "value") return VALUE_STEPS;
  if (stage === "agent-selection") return agentSelectionSteps;
  return confirmationSteps;
}

function resolveConfirmHandler(
  stage: InitFlowStage,
  handlers: {
    readonly handleProjectConfirm: (values: Record<string, string>) => void;
    readonly handleAudienceGateConfirm: (values: Record<string, string>) => void;
    readonly handleAudienceConfirm: (values: Record<string, string>) => void;
    readonly handleValueGateConfirm: (values: Record<string, string>) => void;
    readonly handleValueConfirm: (values: Record<string, string>) => void;
    readonly handleAgentSelectionConfirm: (
      values: Record<string, string>,
    ) => void;
    readonly handleConfirmationConfirm: (
      values: Record<string, string>,
    ) => void;
  },
): (values: Record<string, string>) => void {
  if (stage === "project") return handlers.handleProjectConfirm;
  if (stage === "audience-gate") return handlers.handleAudienceGateConfirm;
  if (stage === "audience") return handlers.handleAudienceConfirm;
  if (stage === "value-gate") return handlers.handleValueGateConfirm;
  if (stage === "value") return handlers.handleValueConfirm;
  if (stage === "agent-selection") return handlers.handleAgentSelectionConfirm;
  return handlers.handleConfirmationConfirm;
}

function buildAgentSelectionSteps(
  planResponse: PlanProjectInitResponse | null,
): readonly WizardStepDefinition[] {
  const availableAgents = planResponse?.availableAgents ?? [];
  return [
    {
      title: "Agent Selection",
      description: "Select agents to configure.",
      fields: [
        {
          key: "selectedAgentIds",
          label: "Agents",
          kind: "multi-select",
          options: availableAgents.map((agent) => ({
            value: agent.id,
            label: `${agent.name} (${agent.id})`,
          })),
          defaultValue: availableAgents.map((agent) => agent.id).join(","),
          required: false,
          validate: (value) =>
            validateAgentSelection(value, availableAgents.map((agent) => agent.id)),
        },
      ],
    },
  ];
}

function buildConfirmationSteps(
  plannedChanges: readonly PlannedFileChange[],
): readonly WizardStepDefinition[] {
  return [
    {
      title: "Confirmation",
      description: formatPlannedChanges(plannedChanges),
      fields: [
        {
          key: "confirmInitialization",
          label: "Proceed with initialization?",
          kind: "yes-no",
          defaultValue: "yes",
          required: false,
          validate: validateOptionalYesNo,
        },
      ],
    },
  ];
}

function resolveProgressLabel(
  stage: InitFlowStage,
  planResponse: PlanProjectInitResponse | null,
): string | undefined {
  const stages =
    planResponse !== null && planResponse.availableAgents.length === 0
      ? INIT_FLOW_STAGES_WITHOUT_AGENT_SELECTION
      : INIT_FLOW_STAGES_WITH_AGENT_SELECTION;
  const stageIndex = stages.indexOf(stage);
  if (stageIndex < 0) {
    return undefined;
  }

  return `${stageIndex + 1}/${stages.length}`;
}

function formatPlannedChanges(plannedChanges: readonly PlannedFileChange[]): string {
  if (plannedChanges.length === 0) {
    return "No file changes are required. Confirm to initialize project state.";
  }

  return plannedChanges
    .map((change) => `${change.action}: ${change.path} - ${change.description}`)
    .join("\n");
}

function validateYesNo(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "yes" || normalized === "y" || normalized === "no" || normalized === "n") {
    return null;
  }
  return YES_NO_MESSAGE;
}

function validateOptionalYesNo(value: string): string | null {
  if (value.trim().length === 0) {
    return null;
  }
  return validateYesNo(value);
}

function validateAudiencePriority(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "primary" ||
    normalized === "secondary" ||
    normalized === "tertiary"
  ) {
    return null;
  }
  return "Enter primary, secondary, or tertiary";
}

function validateAgentSelection(
  value: string,
  availableAgentIds: readonly AgentId[],
): string | null {
  const selectedAgentIds = parseAgentSelection(value);
  if (selectedAgentIds.length === 0) {
    return "Select at least one agent";
  }
  const unknownAgentIds = selectedAgentIds.filter(
    (agentId) => !availableAgentIds.includes(agentId),
  );
  if (unknownAgentIds.length > 0) {
    return `Unknown agent id: ${unknownAgentIds.join(", ")}`;
  }
  return null;
}

function parseAgentSelection(value: string): readonly AgentId[] {
  return value
    .split(",")
    .map((agentId) => agentId.trim())
    .filter((agentId) => agentId.length > 0) as readonly AgentId[];
}

function isYes(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "yes" || normalized === "y";
}

function isExplicitNo(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "no" || normalized === "n";
}

function toAudiencePriority(value: string): AddAudienceRequest["priority"] {
  return value.trim().toLowerCase() as AddAudienceRequest["priority"];
}

async function persistCollectedPrimitives(
  controllers: InitFlowActionControllers,
  audiences: readonly AddAudienceRequest[],
  valuePropositions: readonly AddValuePropositionRequest[],
): Promise<{ readonly ok: true } | { readonly ok: false; readonly error: Error }> {
  for (const audience of audiences) {
    if (controllers.addAudienceController === undefined) {
      return {
        ok: false,
        error: new Error(REQUIRED_AUDIENCE_CONTROLLER_ERROR),
      };
    }
    const result = await dispatchTuiAction(
      controllers.addAudienceController,
      audience,
    );
    if (!result.ok) {
      return result;
    }
  }

  for (const valueProposition of valuePropositions) {
    if (controllers.addValuePropositionController === undefined) {
      return {
        ok: false,
        error: new Error(REQUIRED_VALUE_PROPOSITION_CONTROLLER_ERROR),
      };
    }
    const result = await dispatchTuiAction(
      controllers.addValuePropositionController,
      valueProposition,
    );
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
}

function flattenCollectedValues(
  projectDetails: ProjectDetails | null,
  audiences: readonly AddAudienceRequest[],
  valuePropositions: readonly AddValuePropositionRequest[],
): Record<string, string> {
  return {
    projectName: projectDetails?.name ?? "",
    purpose: projectDetails?.purpose ?? "",
    audienceCount: String(audiences.length),
    valuePropositionCount: String(valuePropositions.length),
  };
}
