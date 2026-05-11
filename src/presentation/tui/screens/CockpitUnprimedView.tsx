import React from "react";
import { Box, Text } from "ink";
import { TuiColors } from "../../shared/DesignTokens.js";
import { Panel } from "../components/Panel.js";
import { SectionHeading } from "../components/SectionHeading.js";

export function CockpitUnprimedView(): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={TuiColors.primary} wrap="wrap">
        This looks like an existing project. 
        Let's start by giving Jumbo some project context before adding your first goal.
      </Text>
      <Box flexDirection="row">
        <Box flexBasis="8%" />
        <Box flexDirection="column" flexBasis="84%">
          <SectionHeading title="NEXT STEPS" />
          <Box flexDirection="column" marginTop={1}>
            <Text color={TuiColors.primary} wrap="wrap">
              1. Open another shell in this directory
            </Text>
            <Text color={TuiColors.primary} wrap="wrap">
              2. Start your editor or AI coding agent
            </Text>
            <Text color={TuiColors.primary} wrap="wrap">
              3. Let the agent explore the project and save insights to Jumbo's memory
            </Text>
          </Box>
          <Box marginTop={1}>
            <Panel title="" borderColor={TuiColors.warning}>
              <Text color={TuiColors.warning} wrap="wrap">
                Note: You'll need to nudge your agent by prompting 'follow
                instructions'.
              </Text>
            </Panel>
          </Box>
        </Box>
        <Box flexBasis="8%" />
      </Box>
    </Box>
  );
}
