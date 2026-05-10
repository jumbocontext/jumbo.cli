import React from "react";
import { Box, Text } from "ink";
import { BaseColors, TuiColors } from "../../shared/DesignTokens.js";

export function CockpitPrimedEmptyView(): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={TuiColors.primary} wrap="wrap">
        Project memory is ready. Now create your first goal.
      </Text>
      <Box marginTop={1}>
        <Text color={TuiColors.primary} wrap="wrap">
          Goals are the center of how Jumbo turns project memory into useful
          work. A goal is simply an objective, success criteria, and scope.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={TuiColors.primary} wrap="wrap">
          That gives Jumbo's memory something to organize around. When the agent
          starts the goal, Jumbo provides a focused context packet with relevant
          project knowledge and execution instructions.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={TuiColors.primary} wrap="wrap">
          New memories are captured as corrections and discoveries arise, and
          each completed goal leaves the system better prepared for the next one.
        </Text>
      </Box>
      <Box
        marginTop={2}
        flexDirection="column"
        alignItems="center"
        width="100%"
      >
        <Text>
          <Text color={TuiColors.primary}>Press </Text>
          <Text color={BaseColors.brandBlue} bold>
            [g]
          </Text>
          <Text color={TuiColors.primary}> to add a goal</Text>
        </Text>
        <Box marginTop={1}>
          <Text color={TuiColors.muted}>
            or run 'jumbo goal add' from another terminal
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
