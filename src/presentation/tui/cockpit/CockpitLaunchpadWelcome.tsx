import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";

export function CockpitLaunchpadWelcome(): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      flexShrink={0}
      paddingX={1}
      marginY={1}
      borderColor={BaseColors.brandBlue}
      borderStyle="round"
    >
      <Box flexDirection="row">
        <Text color={BaseColors.brandBlue}>
          Welcome//
        </Text>
      </Box>
      <Box flexDirection="row">
        <Text color={BaseColors.shade1}>
          Run Jumbo worker daemons to keep goal workflows moving. Each worker watches Jumbo state, starts your configured agent when a goal is ready, and prompts it through the next CLI step: refinement, review, or codification.
        </Text>
      </Box>
      <Box flexDirection="row" marginTop={1}>
        <Text color={BaseColors.shade1}>
          You define and prioritize the work; Jumbo handles the repeatable agent handoffs.
        </Text>
      </Box>
      <Box width="100%" justifyContent="flex-end">
        <KeyBadge
          char="x"
          label="hide"
          color={BaseColors.brandBlue}
          labelColor={BaseColors.shade4}
        />
      </Box>
    </Box>
  );
}
