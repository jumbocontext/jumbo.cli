import React from "react";
import { Box, Text } from "ink";
import { BaseColors, SemanticColors, TuiLayout } from "../../shared/DesignTokens.js";
import { CenteredPrompt } from "./CenteredPrompt.js";
import { SectionHeading } from "../ui-primitives/SectionHeading.js";

export function CockpitUnprimedView(): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} width="100%" paddingY={1} alignItems="center">
      <Box flexDirection="column" width={TuiLayout.bannerWidth} paddingX={2}>
        <Box flexDirection="row">
          <Box flexBasis="3%" />
          <Box flexDirection="column" flexBasis="94%">
            <Text color={SemanticColors.primary} wrap="wrap">
              This looks like an existing project.
              Start by giving Jumbo some project context before adding your first goal.
            </Text>
          </Box>
          <Box flexBasis="3%" />
        </Box>
        <Box flexDirection="row">
          <Box flexBasis="10%" />
          <Box flexDirection="column" flexBasis="80%" marginTop={1}>
            <SectionHeading title="NEXT STEPS" />
            <Box flexDirection="column" marginTop={1}>
              <Text color={SemanticColors.primary} wrap="wrap">
                1. Open another shell in this directory
              </Text>
              <Text color={SemanticColors.primary} wrap="wrap">
                2. Start AI coding agent (e.g. claude, codex, etc.)
              </Text>
              <Text color={BaseColors.brandYellow} dimColor wrap="wrap">
                Note: You'll need to nudge your agent by prompting 'follow
                instructions'.
              </Text>
              <Text color={SemanticColors.primary} wrap="wrap">
                3. Let the agent explore the project and save insights to Jumbo's memory when it asks
              </Text>
            </Box>
          </Box>
          <Box flexBasis="10%" />
        </Box>
        <Box marginTop={2}>
          <CenteredPrompt
            keyChar="s"
            prefix="Press "
            suffix=" to skip this screen for now"
          />
        </Box>
      </Box>
    </Box>
  );
}
