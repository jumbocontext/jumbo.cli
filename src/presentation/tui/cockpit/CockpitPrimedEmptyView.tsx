import React from "react";
import { Box, Text } from "ink";
import { SemanticColors, TuiLayout } from "../../shared/DesignTokens.js";
import { CenteredPrompt } from "./CenteredPrompt.js";
import { SectionHeading } from "../ui-primitives/SectionHeading.js";

export function CockpitPrimedEmptyView(): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} width="100%" paddingY={1} alignItems="center">
      <Box flexDirection="column" width={TuiLayout.bannerWidth} paddingX={2}>
        <Box marginTop={1} flexDirection="column" alignItems="center">
          <Text color={SemanticColors.primary} wrap="wrap">
            Project memory is stored. Ready to create your first goal.
          </Text>
        </Box>
        <Box marginTop={2}>
          <CenteredPrompt
            keyChar="g"
            prefix="Press "
            suffix=" to add a goal"
            secondary="or run 'jumbo goal add' from another terminal"
          />
        </Box>
        <Box marginTop={1}>
          <SectionHeading title="A PRIMER ON GOALS" />
        </Box>
        <Box marginTop={1}>
          <Text color={SemanticColors.primary} wrap="wrap">
            With Jumbo, you define work as goals, not open-ended agent prompts.
            A goal is the unit of work: an objective, success criteria, and scope.
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={SemanticColors.primary} wrap="wrap">
            Goals give project memory a single object to organize around. When
            an agent starts the goal with the Jumbo CLI, Jumbo returns focused
            project knowledge and workflow instructions for that goal.
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={SemanticColors.primary} wrap="wrap">
            New memories are captured only through explicit Jumbo commands run
            by the agent or by you as corrections, decisions, and discoveries
            arise during the work.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
