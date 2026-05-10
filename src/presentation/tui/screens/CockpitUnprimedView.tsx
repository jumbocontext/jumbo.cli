import React from "react";
import { Box, Text } from "ink";
import { BaseColors, TuiColors } from "../../shared/DesignTokens.js";
import { Panel } from "../components/Panel.js";

export function CockpitUnprimedView(): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={TuiColors.primary} wrap="wrap">
        This looks like an existing project. 
        Let's start by giving Jumbo some project context before adding your first goal.
      </Text>
      <Box marginTop={1}>
        <Text color={TuiColors.primary} wrap="wrap">
          Goals work best when Jumbo has memory to attach them to, so future work
          can be more accurate, efficient, and grounded.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={TuiColors.primary} wrap="wrap">
          Open another shell in this directory and start your editor or AI coding
          agent. The agent should ask for permission to explore the project and
          save useful insights to Jumbo's memory.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Panel title="" borderColor={TuiColors.warning}>
          <Text color={TuiColors.warning} wrap="wrap">
            Note: You'll need to nudge your agent by prompting 'future
            instructions'.
          </Text>
        </Panel>
      </Box>
    </Box>
  );
}
