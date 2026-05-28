import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { CockpitLaunchpadWelcomeCopy } from "./CockpitLaunchpadWelcomeCopy.js";

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
          {CockpitLaunchpadWelcomeCopy.title}
        </Text>
      </Box>
      <Box flexDirection="row">
        <Text color={BaseColors.shade1}>
          {CockpitLaunchpadWelcomeCopy.paragraphs[0]}
        </Text>
      </Box>
      <Box flexDirection="row" marginTop={1}>
        <Text color={BaseColors.shade1}>
          {CockpitLaunchpadWelcomeCopy.paragraphs[1]}
        </Text>
      </Box>
      <Box width="100%" justifyContent="flex-end">
        <KeyBadge
          char={CockpitLaunchpadWelcomeCopy.hidePrompt.char}
          label={CockpitLaunchpadWelcomeCopy.hidePrompt.label}
          color={BaseColors.brandBlue}
          labelColor={BaseColors.shade4}
        />
      </Box>
    </Box>
  );
}
