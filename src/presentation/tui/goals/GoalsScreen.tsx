import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  BaseColors,
  SemanticColors,
  TuiLayout,
} from "../../shared/DesignTokens.js";
import { GoalStatus, type GoalStatusType } from "../../../domain/goals/Constants.js";
import type { GoalView } from "../../../application/context/goals/GoalView.js";
import { DetailPane } from "../ui-primitives/DetailPane.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { Panel } from "../ui-primitives/Panel.js";
import { Tumbler } from "../ui-primitives/Tumbler.js";
import { GoalAuthoringFlow } from "./GoalAuthoringFlow.js";
import type { GoalAuthoringValues } from "./GoalAuthoringFlow.js";
import { useGoalsList } from "../state-reading/TuiStateReader.js";
import {
  GOAL_DETAIL_JOIN_SEPARATOR,
  GOAL_STATUS_FILTER_ALL,
  GOAL_STATUS_FILTERS,
  GOAL_TUMBLER_MAX_DISPLAY_LENGTH,
  GoalsScreenCopy,
} from "./GoalsScreenConstants.js";

interface GoalListEntry {
  readonly id: string;
  readonly title: string;
  readonly status: GoalStatusType;
  readonly objective: string;
  readonly criteria: readonly string[];
  readonly scopeIn: readonly string[];
  readonly scopeOut: readonly string[];
  readonly progress: readonly string[];
  readonly prerequisiteGoals: readonly string[];
  readonly note?: string;
  readonly reviewIssues?: string;
  readonly nextGoalId?: string;
}

const STATUS_COLORS: Record<GoalStatusType, string> = {
  [GoalStatus.TODO]: SemanticColors.muted,
  [GoalStatus.REFINED]: SemanticColors.info,
  [GoalStatus.DOING]: SemanticColors.success,
  [GoalStatus.BLOCKED]: SemanticColors.error,
  [GoalStatus.INREVIEW]: SemanticColors.warning,
  [GoalStatus.DONE]: BaseColors.brandGreen70,
  [GoalStatus.PAUSED]: SemanticColors.warning,
  [GoalStatus.QUALIFIED]: SemanticColors.success,
  [GoalStatus.REJECTED]: SemanticColors.error,
  [GoalStatus.SUBMITTED]: SemanticColors.info,
  [GoalStatus.CODIFYING]: SemanticColors.accent,
  [GoalStatus.IN_REFINEMENT]: SemanticColors.info,
  [GoalStatus.UNBLOCKED]: SemanticColors.warning,
};

export function GoalsScreen(): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterIndex, setFilterIndex] = useState(0);
  const [authoringOpen, setAuthoringOpen] = useState(false);

  const activeFilter = GOAL_STATUS_FILTERS[filterIndex];
  const requestedStatus =
    activeFilter === GOAL_STATUS_FILTER_ALL
      ? undefined
      : (activeFilter as GoalStatusType);
  const goalsList = useGoalsList(requestedStatus);
  const visibleGoals = useMemo(
    () => {
      const responseGoals = goalsList.data?.goals;

      if (responseGoals !== undefined) {
        return responseGoals.map(toGoalListEntry);
      }

      return [];
    },
    [goalsList.data],
  );
  const selectedGoal = visibleGoals[selectedIndex] ?? visibleGoals[0];

  useInput((input, key) => {
    if (authoringOpen) {
      return;
    }

    if (key.rightArrow) {
      const nextFilterIndex = (filterIndex + 1) % GOAL_STATUS_FILTERS.length;
      setFilterIndex(nextFilterIndex);
      setSelectedIndex(0);
      return;
    }

    if (key.leftArrow) {
      const nextFilterIndex =
        filterIndex === 0 ? GOAL_STATUS_FILTERS.length - 1 : filterIndex - 1;
      setFilterIndex(nextFilterIndex);
      setSelectedIndex(0);
      return;
    }

    if (input === "a" || input === "A") {
      setAuthoringOpen(true);
    }
  });

  const handleAuthoringComplete = (_values: GoalAuthoringValues) => {
    setAuthoringOpen(false);
  };

  const handleAuthoringCancel = () => {
    setAuthoringOpen(false);
  };

  const tumblerItems = visibleGoals.map((goal) => ({
    key: goal.id,
    value: `${goal.title} ${goal.status}`,
  }));

  const handleFocusedGoalChange = (item: { key: string }) => {
    const nextSelectedIndex = visibleGoals.findIndex(
      (goal) => goal.id === item.key,
    );
    if (nextSelectedIndex >= 0) {
      setSelectedIndex(nextSelectedIndex);
    }
  };

  if (authoringOpen) {
    return (
      <GoalAuthoringFlow
        onComplete={handleAuthoringComplete}
        onCancel={handleAuthoringCancel}
      />
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1} gap={1}>

      <Box gap={2}>
        {goalsList.loading && goalsList.data === null ? (
          <Panel title={GoalsScreenCopy.listTitle} width={TuiLayout.listPanelWidth}>
            <Text color={SemanticColors.muted}>{GoalsScreenCopy.loadingGoals}</Text>
          </Panel>
        ) : goalsList.error !== null ? (
          <Panel title={GoalsScreenCopy.listTitle} width={TuiLayout.listPanelWidth}>
            <Text color={SemanticColors.error}>{goalsList.error.message}</Text>
          </Panel>
        ) : (
          <Tumbler
            key={activeFilter}
            title={GoalsScreenCopy.listTitle}
            items={tumblerItems}
            initialFocusedKey={selectedGoal?.id}
            maxDisplayLength={GOAL_TUMBLER_MAX_DISPLAY_LENGTH}
            width={TuiLayout.listPanelWidth}
            emptyMessage={GoalsScreenCopy.emptyGoals}
            onFocusedItemChange={handleFocusedGoalChange}
          />
        )}

        {selectedGoal && (
          <DetailPane
            title={GoalsScreenCopy.detailTitle}
            width={TuiLayout.detailPanelWidth}
            entries={[
              { label: GoalsScreenCopy.details.id, value: selectedGoal.id },
              { label: GoalsScreenCopy.details.title, value: selectedGoal.title },
              {
                label: GoalsScreenCopy.details.status,
                value: selectedGoal.status,
                valueColor: STATUS_COLORS[selectedGoal.status],
              },
              { label: GoalsScreenCopy.details.objective, value: selectedGoal.objective },
              {
                label: GoalsScreenCopy.details.criteria,
                value: selectedGoal.criteria.join(GOAL_DETAIL_JOIN_SEPARATOR),
              },
              {
                label: GoalsScreenCopy.details.scopeIn,
                value: selectedGoal.scopeIn.join(GOAL_DETAIL_JOIN_SEPARATOR),
              },
              {
                label: GoalsScreenCopy.details.scopeOut,
                value: selectedGoal.scopeOut.join(GOAL_DETAIL_JOIN_SEPARATOR),
              },
              {
                label: GoalsScreenCopy.details.prerequisites,
                value:
                  selectedGoal.prerequisiteGoals
                    .join(GOAL_DETAIL_JOIN_SEPARATOR) || GoalsScreenCopy.emptyFieldValue,
              },
              {
                label: GoalsScreenCopy.details.progress,
                value:
                  selectedGoal.progress.join(GOAL_DETAIL_JOIN_SEPARATOR)
                  || GoalsScreenCopy.emptyFieldValue,
              },
              { label: GoalsScreenCopy.details.note, value: selectedGoal.note ?? GoalsScreenCopy.emptyFieldValue },
              {
                label: GoalsScreenCopy.details.reviewIssues,
                value: selectedGoal.reviewIssues ?? GoalsScreenCopy.emptyFieldValue,
              },
              {
                label: GoalsScreenCopy.details.nextGoal,
                value: selectedGoal.nextGoalId ?? GoalsScreenCopy.emptyFieldValue,
              },
            ]}
          />
        )}
      </Box>

      {selectedGoal && (
        <Panel title={GoalsScreenCopy.actionHintsTitle}>
          <Box gap={2}>
            <KeyBadge char="a" label={GoalsScreenCopy.shortcuts.author} />
            <KeyBadge char="↑↓" label={GoalsScreenCopy.shortcuts.select} />
            <KeyBadge char="←→" label={GoalsScreenCopy.shortcuts.filter} />
          </Box>
        </Panel>
      )}
    </Box>
  );
}

function toGoalListEntry(goal: GoalView): GoalListEntry {
  return {
    id: goal.goalId,
    title: goal.title,
    status: goal.status,
    objective: goal.objective,
    criteria: goal.successCriteria,
    scopeIn: goal.scopeIn,
    scopeOut: goal.scopeOut,
    progress: goal.progress,
    prerequisiteGoals: goal.prerequisiteGoals ?? [],
    note: goal.note,
    reviewIssues: goal.reviewIssues,
    nextGoalId: goal.nextGoalId,
  };
}
